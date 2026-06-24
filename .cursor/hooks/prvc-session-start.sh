#!/usr/bin/env bash
# ProvenanceCode session start hook
# Checks the API is reachable and registers the Cursor agent if needed.
# Fails open — a non-responsive API should never block Cursor from opening.

set -euo pipefail

PRVC_API="${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}"
PRVC_KEY="${PROVENANCECODE_PAT:-dev-key}"
PRVC_TENANT="${PROVENANCECODE_TENANT_ID:-tenant-dev}"
PRVC_AGENT="${PROVENANCECODE_AGENT_ID:-agent-cursor}"

# ── Check API health ─────────────────────────────────────────────────────────

health=$(curl -sf --max-time 3 "${PRVC_API}/health" 2>/dev/null) || {
  echo '{"additional_context":"ProvenanceCode API is not reachable. Shell governance and MCP tools will fail open until the API is available."}'
  exit 0
}

# ── Ensure this agent is registered ─────────────────────────────────────────

reg=$(curl -sf --max-time 3 \
  "${PRVC_API}/agents/${PRVC_TENANT}/${PRVC_AGENT}" \
  -H "x-api-key: ${PRVC_KEY}" 2>/dev/null) || reg=""

if [[ -z "$reg" || "$(echo "$reg" | jq -r '.agentId // empty' 2>/dev/null)" == "" ]]; then
  curl -sf --max-time 5 \
    -X POST "${PRVC_API}/agents" \
    -H "x-api-key: ${PRVC_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"agentId\": \"${PRVC_AGENT}\",
      \"tenantId\": \"${PRVC_TENANT}\",
      \"name\": \"Cursor Agent (${PRVC_AGENT})\",
      \"status\": \"active\",
      \"capabilities\": [\"aws.cli.run\", \"infra.*\", \"project.*\", \"deploy.*\", \"file.*\", \"k8s.*\", \"terraform.*\", \"helm.*\", \"gcloud.*\"]
    }" > /dev/null 2>&1 || true
fi

api_status=$(echo "$health" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

echo "{\"additional_context\":\"ProvenanceCode API: ${api_status}. Agent '${PRVC_AGENT}' registered. Shell governance active for: aws, kubectl, terraform, helm, gcloud. MCP tools available via .cursor/mcp.json.\"}"
exit 0
