#!/usr/bin/env bash
# ProvenanceCode task-end hook
#
# Fires when a Cursor agent task ends. Finds the most recent in_progress TAP
# and transitions it to completed (or failed, based on exit code).
#
# Environment:
#   PRVC_TASK_OUTCOME   override outcome: succeeded | failed | blocked | partial
#   PRVC_TASK_SUMMARY   short summary to write into task.summary
#
# Fails open — a failure here MUST NOT affect task result reporting to the user.

set -euo pipefail

REPO_ROOT="${PROVENANCECODE_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
TASKS_DIR="${REPO_ROOT}/provenance/tasks"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTCOME="${PRVC_TASK_OUTCOME:-succeeded}"
SUMMARY="${PRVC_TASK_SUMMARY:-}"

# ── Find latest in_progress TAP ───────────────────────────────────────────────

latest_tap=""
latest_seq=0

for d in "${TASKS_DIR}"/TAP-[0-9][0-9][0-9][0-9][0-9][0-9]; do
  [[ -f "${d}/task.json" ]] || continue
  state=$(python3 -c "import json,sys; d=json.load(open('${d}/task.json')); print(d.get('lifecycle',{}).get('state',''))" 2>/dev/null || echo "")
  [[ "$state" == "in_progress" ]] || continue
  num="${d##*/TAP-}"
  num=$((10#${num}))
  if (( num > latest_seq )); then
    latest_seq=$num
    latest_tap="${d}"
  fi
done

if [[ -z "${latest_tap}" ]]; then
  echo '{"additional_context":"No in_progress TAP found to finalise. Create a TAP manually if needed."}'
  exit 0
fi

tap_id=$(basename "${latest_tap}")
tap_file="${latest_tap}/task.json"

# ── Get HEAD commit SHA ───────────────────────────────────────────────────────

commit_sha=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "null")
[[ "$commit_sha" == "null" ]] && commit_sha_json="null" || commit_sha_json="\"${commit_sha}\""

# ── Update task.json in-place using Python (available everywhere) ─────────────

python3 - "${tap_file}" "${NOW}" "${OUTCOME}" "${commit_sha}" "${SUMMARY}" <<'PYEOF'
import json, sys, datetime

tap_file, ended_at, outcome, commit_sha, summary = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]

with open(tap_file) as f:
    tap = json.load(f)

tap['lifecycle']['state'] = 'completed' if outcome == 'succeeded' else outcome
tap['timestamps']['ended_at'] = ended_at
tap['timestamps']['attested_at'] = ended_at

if outcome in ('succeeded', 'partial'):
    tap['task']['outcome'] = 'succeeded' if outcome == 'succeeded' else 'partial'
else:
    tap['task']['outcome'] = outcome

if summary:
    tap['task']['summary'] = summary

if commit_sha and commit_sha != 'null':
    tap['git']['commit_sha'] = commit_sha

with open(tap_file, 'w') as f:
    json.dump(tap, f, indent=2)
    f.write('\n')
PYEOF

echo "{\"additional_context\":\"TAP finalised: ${tap_id} → ${OUTCOME}. Commit: ${commit_sha}. File: provenance/tasks/${tap_id}/task.json. Add ACT/MEO links and set enforcement.validated=true when ready.\"}"
exit 0
