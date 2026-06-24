#!/usr/bin/env bash
# ProvenanceCode task-start hook
#
# Fires when a Cursor agent task begins. Creates a TAP artifact at
# provenance/tasks/TAP-XXXXXX/task.json with lifecycle.state = in_progress.
#
# Fails open — a failure here MUST NOT block the agent task.

set -euo pipefail

REPO_ROOT="${PROVENANCECODE_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
TASKS_DIR="${REPO_ROOT}/provenance/tasks"
AGENT="${PROVENANCECODE_AGENT_ID:-cursor}"
MODEL="${PROVENANCECODE_MODEL:-claude-sonnet-4-5}"
BRANCH=$(git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Determine next TAP sequence number ───────────────────────────────────────

mkdir -p "${TASKS_DIR}"

last_seq=0
for d in "${TASKS_DIR}"/TAP-[0-9][0-9][0-9][0-9][0-9][0-9]; do
  [[ -d "$d" ]] || continue
  num="${d##*/TAP-}"
  num=$((10#${num}))
  (( num > last_seq )) && last_seq=$num
done

next_seq=$(( last_seq + 1 ))
tap_id=$(printf "TAP-%06d" "$next_seq")
tap_dir="${TASKS_DIR}/${tap_id}"

mkdir -p "${tap_dir}"

# ── Write task.json ───────────────────────────────────────────────────────────

cat > "${tap_dir}/task.json" <<EOF
{
  "schema": "provenancecode.tap.v1",
  "id": "${tap_id}",
  "title": "Agent task — ${BRANCH}",
  "version": 1,
  "lifecycle": {
    "state": "in_progress",
    "supersedes": null,
    "superseded_by": null
  },
  "timestamps": {
    "started_at": "${NOW}",
    "ended_at": null,
    "attested_at": null
  },
  "runtime": {
    "agent": "${AGENT}",
    "model": "${MODEL}",
    "session_id": "${CURSOR_SESSION_ID:-null}",
    "conversation_id": null
  },
  "git": {
    "repo": "$(basename "${REPO_ROOT}")",
    "branch": "${BRANCH}",
    "commit_sha": null,
    "changed_files": [],
    "pr_url": null
  },
  "actors": {
    "agent": "${AGENT}",
    "model": "${MODEL}",
    "human_reviewer": null,
    "approvers": []
  },
  "task": {
    "description": null,
    "outcome": "succeeded",
    "summary": null,
    "tools_used": [],
    "tool_call_count": 0
  },
  "risk": {
    "level": "low",
    "open_risks": 0,
    "high_or_critical_open": 0,
    "needs_human_review": false
  },
  "enforcement": {
    "validated": false,
    "validator": null,
    "errors": [],
    "preset": "standard"
  },
  "links": {
    "decisions": [],
    "risks": [],
    "actions": [],
    "memories_read": [],
    "memories_written": [],
    "specs": [],
    "prior_task": null,
    "parent_task": null
  },
  "integrity": {
    "task_hash": null,
    "signed": false,
    "certificate": null
  }
}
EOF

echo "{\"additional_context\":\"TAP created: ${tap_id} (in_progress). Branch: ${BRANCH}. File: provenance/tasks/${tap_id}/task.json. Update task.title, task.description, and mark lifecycle.state=completed when done.\"}"
exit 0
