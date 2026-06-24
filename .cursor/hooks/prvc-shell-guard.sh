#!/usr/bin/env bash
# ProvenanceCode shell guard
# Fires on beforeShellExecution for: aws, kubectl, terraform, helm, gcloud
#
# Flow:
#   1. Parse the command to determine action type + resource
#   2. Submit to ProvenanceCode API as a governed action
#   3. Poll for policy decision (ALLOW / DENY / STEP_UP)
#   4. Return allow / deny / ask accordingly

set -euo pipefail

PRVC_API="${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}"
PRVC_KEY="${PROVENANCECODE_PAT:-dev-key}"
PRVC_TENANT="${PROVENANCECODE_TENANT_ID:-tenant-dev}"
PRVC_AGENT="${PROVENANCECODE_AGENT_ID:-agent-cursor}"
PRVC_DASHBOARD="${PROVENANCECODE_DASHBOARD_URL:-http://127.0.0.1:3002}"
POLL_TIMEOUT=30
POLL_INTERVAL=2

input=$(cat)
command_str=$(echo "$input" | jq -r '.command // empty' 2>/dev/null || echo "")

if [[ -z "$command_str" ]]; then
  echo '{"permission":"allow"}'
  exit 0
fi

# ── Determine action type and resource from command string ──────────────────

first_word=$(echo "$command_str" | awk '{print $1}' | xargs basename 2>/dev/null || echo "")
second_word=$(echo "$command_str" | awk '{print $2}' || echo "")
third_word=$(echo "$command_str" | awk '{print $3}' || echo "")

case "$first_word" in
  aws)
    action="aws.cli.run"
    resource="cli:${second_word:-unknown}:${third_word:-unknown}"
    ;;
  kubectl)
    action="k8s.kubectl"
    resource="k8s:${second_word:-unknown}"
    ;;
  terraform)
    action="terraform.${second_word:-run}"
    resource="terraform:${second_word:-unknown}"
    ;;
  helm)
    action="helm.${second_word:-run}"
    resource="helm:${second_word:-unknown}"
    ;;
  gcloud)
    action="gcloud.${second_word:-run}"
    resource="gcloud:${second_word:-unknown}:${third_word:-unknown}"
    ;;
  *)
    echo '{"permission":"allow"}'
    exit 0
    ;;
esac

# ── Submit action to ProvenanceCode ────────────────────────────────────────

payload=$(jq -nc \
  --arg tenant "$PRVC_TENANT" \
  --arg agent "$PRVC_AGENT" \
  --arg action "$action" \
  --arg resource "$resource" \
  --arg command "$command_str" \
  '{
    tenant_id: $tenant,
    agent_id: $agent,
    action: $action,
    resource: $resource,
    payload: { command: $command, source: "cursor-shell-hook" }
  }')

response=$(curl -sf \
  -X POST "${PRVC_API}/actions" \
  -H "x-api-key: ${PRVC_KEY}" \
  -H "Content-Type: application/json" \
  -d "$payload" 2>/dev/null) || {
  # API unreachable — fail open so developer workflow isn't blocked
  echo '{"permission":"allow","agent_message":"ProvenanceCode API unreachable — shell command allowed (fail open)."}'
  exit 0
}

action_id=$(echo "$response" | jq -r '.action_id // empty' 2>/dev/null || echo "")
policy=$(echo "$response" | jq -r '.policy_decision // empty' 2>/dev/null || echo "")

if [[ -z "$action_id" ]]; then
  echo '{"permission":"allow"}'
  exit 0
fi

# Immediate deny
if [[ "$policy" == "DENY" ]]; then
  echo "{\"permission\":\"deny\",\"user_message\":\"Denied by policy: ${action} on ${resource}. Ledger: ${PRVC_DASHBOARD}/actions/${action_id}\"}"
  exit 0
fi

# Requires human approval (STEP_UP / REQUIRES_APPROVAL)
if [[ "$policy" == "STEP_UP" || "$policy" == "REQUIRES_APPROVAL" ]]; then
  echo "{\"permission\":\"ask\",\"user_message\":\"This command requires human approval before it can run. Approve at: ${PRVC_DASHBOARD}/actions/${action_id}\",\"agent_message\":\"Action ${action_id} requires human approval (STEP_UP). Do not proceed until approved.\"}"
  exit 0
fi

# ALLOW — but still poll to confirm execution was logged
if [[ "$policy" == "ALLOW" ]]; then
  deadline=$((SECONDS + POLL_TIMEOUT))
  while [[ $SECONDS -lt $deadline ]]; do
    sleep "$POLL_INTERVAL"
    status_resp=$(curl -sf \
      "${PRVC_API}/actions/${action_id}" \
      -H "x-api-key: ${PRVC_KEY}" 2>/dev/null) || break
    exec_status=$(echo "$status_resp" | jq -r '.execution_status // empty' 2>/dev/null || echo "")
    if [[ "$exec_status" == "completed" || "$exec_status" == "failed" || "$exec_status" == "denied" ]]; then
      break
    fi
  done
  echo "{\"permission\":\"allow\",\"agent_message\":\"ProvenanceCode: action ${action_id} logged. Ledger: ${PRVC_DASHBOARD}/actions/${action_id}\"}"
  exit 0
fi

# Unknown decision — fail open
echo '{"permission":"allow"}'
exit 0
