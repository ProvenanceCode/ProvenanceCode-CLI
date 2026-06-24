# ProvenanceCode Artifact Rules for Cursor

## Overview

This project uses the **ProvenanceCode Standard v2.0** with two artifact tracks:

| Track | Version | Artifacts |
|---|---|---|
| Repo Governance | v1.x | DEO (decisions), RA (risks) |
| Runtime Governance | v2.0 | TAP (tasks), ACT (actions), MEO (memories) |

**Configuration:**
- Standard: ProvenanceCode v2.0
- ID Style: hierarchical
- Project: MYAPP
- Default Subproject: CORE
- Decision ID Format: `DEC-MYAPP-CORE-{SEQ7}` (7-digit zero-padded)
- Risk ID Format: `RA-{PROJECT}-{SUBPROJECT}-{SEQ6}`
- TAP ID Format: `TAP-{SEQ6}` (simple) or `TAP-{PROJECT}-{SUBPROJECT}-{SEQ6}` (hierarchical)
- ACT ID Format: `ACT-{SEQ6}` or `ACT-{PROJECT}-{SUBPROJECT}-{SEQ6}`
- MEO ID Format: `MEO-{SEQ6}` or `MEO-{PROJECT}-{AGENT}-{SEQ6}`

## Decision Record Creation

When creating ProvenanceCode decision records:

### 1. Schema Identifier

All decisions MUST use: `"schema": "provenancecode.decision.v1"`

### 2. ID Format

New decisions: `DEC-MYAPP-CORE-{SEQ7}` — auto-increment by checking existing files in `provenance/decisions/`.

The folder name MUST match the `id` field (e.g. `provenance/decisions/DEC-MYAPP-CORE-0000001/decision.json`).

### 3. Required Fields

| Field | Description |
|---|---|
| `schema` | `"provenancecode.decision.v1"` |
| `id` | Properly formatted decision ID |
| `title` | Brief, descriptive title (max 120 chars) |
| `version` | Integer, starts at 1 |
| `lifecycle.state` | One of: `draft`, `proposed`, `accepted`, `rejected`, `superseded` |
| `timestamps.created_at` | ISO 8601 timestamp |
| `actors.author` | Author username or identifier |
| `outcome` | What was decided |
| `rationale` | Why this was chosen |
| `risk.level` | One of: `low`, `medium`, `high`, `critical` |

### 4. Lifecycle States

`draft` → `proposed` → `accepted` → `superseded`

`draft` → `proposed` → `rejected` (terminal)

`accepted` decisions MUST NOT be edited — create a new decision and mark old as `superseded`.

### 5. AI Attribution

Use `actors.bot` for AI-assisted drafts:
- `"cursor-ai"` for Cursor
- `"kiro"` for Kiro
- `"claude-code"` for Claude Code

### 6. Best Practices

- ✅ Link PRs and issues in `links.pr` and `links.issues`
- ✅ List alternatives in `options`
- ✅ Describe why in `rationale`
- ✅ Set `actors.bot` when AI drafted the decision
- ✅ Keep records atomic and focused
- ✅ Use the CLI: `npx prvc journal add "Title"`

## Risk Record Creation

### 1. ID Format

`RA-{PROJECT}-{SUBPROJECT}-{SEQ6}`

### 2. Severity Levels

`low` | `medium` | `high` | `critical`

### 3. Status Values

`open` | `monitoring` | `mitigated` | `accepted` | `closed`

### 4. Link Decisions

Reference related decision IDs in `links.decisions`.

## CLI Commands

```bash
# Quick add decision
npx prvc journal add "Decision title"

# Use template
npx prvc template use architecture

# Validate
npx prvc validate

# Check quality
npx prvc quality

# Search
npx prvc search "keyword"

# Show decision
npx prvc show DEC-MYAPP-CORE-0000001
```

## Important Notes

- ⚠️ Do NOT enforce approval workflows (CLI doesn't do governance)
- ⚠️ Do NOT block PRs based on decision status
- ✅ DO validate JSON schema compliance
- ✅ DO encourage linking related records
- ✅ DO default to `"draft"` for new records

## Minimal Valid DEO Example

```json
{
  "schema": "provenancecode.decision.v1",
  "id": "DEC-MYAPP-CORE-0000001",
  "title": "Use PostgreSQL for main database",
  "version": 1,
  "lifecycle": {
    "state": "draft"
  },
  "timestamps": {
    "created_at": "2026-05-06T09:00:00Z"
  },
  "actors": {
    "author": "kierandesmond"
  },
  "outcome": "Use PostgreSQL as our primary database.",
  "rationale": "Strong ACID compliance, mature tooling, and team familiarity.",
  "risk": {
    "level": "low"
  }
}
```

## Complete DEO Example (with AI attribution)

```json
{
  "schema": "provenancecode.decision.v1",
  "id": "DEC-MYAPP-CORE-0000002",
  "title": "Migrate from REST to GraphQL for API layer",
  "version": 1,
  "lifecycle": {
    "state": "accepted",
    "supersedes": null,
    "superseded_by": null
  },
  "timestamps": {
    "created_at": "2026-05-06T09:00:00Z",
    "accepted_at": "2026-05-07T10:00:00Z",
    "updated_at": null,
    "expires_at": null
  },
  "actors": {
    "author": "kierandesmond",
    "approver": "alice",
    "bot": "cursor-ai",
    "reviewers": ["bob", "carol"]
  },
  "outcome": "Migrate to GraphQL with gradual rollout starting with mobile endpoints.",
  "rationale": "GraphQL eliminates overfetching and provides type safety. Gradual rollout minimises risk.",
  "risk": {
    "level": "medium",
    "description": "Learning curve and potential performance issues with complex queries.",
    "mitigations": [
      "Team training on GraphQL best practices",
      "Query complexity limits enforced",
      "Performance monitoring dashboard"
    ]
  },
  "problem": "REST API has grown complex with inconsistent patterns and overfetching.",
  "options": [
    "Continue with REST and refactor endpoints",
    "Migrate to GraphQL with gradual rollout",
    "Adopt gRPC for internal services"
  ],
  "scope": ["api", "mobile", "architecture"],
  "tags": ["graphql", "rest", "migration"],
  "links": {
    "pr": ["142"],
    "issues": [],
    "specs": [],
    "decisions": [],
    "risks": []
  }
}
```

---

## TAP — Task Attestation/Provenance

### When to create a TAP

Create a TAP **at the start of every agent task** that touches code, configuration, or infrastructure. The TAP lifecycle: `in_progress` → `completed` / `blocked` / `failed`.

### File location

```
provenance/tasks/TAP-XXXXXX/
  task.json          (REQUIRED)
  task.md            (RECOMMENDED)
  attestation.json   (OPTIONAL — for signed tasks)
  /evidence/         (OPTIONAL)
```

### ID format

New TAPs: `TAP-{SEQ6}` — check `provenance/tasks/` for existing folders and increment.
The folder name MUST match the `id` field.

### Required fields

| Field | Description |
|---|---|
| `schema` | `"provenancecode.tap.v1"` |
| `id` | TAP ID matching folder name |
| `title` | Task title from the prompt |
| `version` | Integer, starts at 1 |
| `lifecycle.state` | `in_progress` at start; update at end |
| `timestamps.started_at` | ISO 8601 when task began |
| `runtime.agent` | `"cursor"` |
| `runtime.model` | Active model (e.g. `"claude-sonnet-4-5"`) |
| `git.branch` | Active git branch |
| `task.outcome` | `succeeded` / `failed` / `blocked` / `partial` |
| `risk.needs_human_review` | `true` if any high/critical risks open |
| `enforcement.validated` | `true` after validation passes |

### Lifecycle states

`in_progress` → `completed` | `blocked` | `failed` | `superseded`

### Validation rules

1. `id` MUST match folder name
2. `git.commit_sha` MUST be a 7–40 char hex string when set
3. `links.actions` MUST reference valid `ACT-*` IDs
4. `links.memories_written` MUST reference valid `MEO-*` IDs
5. If `risk.high_or_critical_open > 0` then `risk.needs_human_review` MUST be `true`
6. `timestamps.ended_at` MUST be after `timestamps.started_at`

### CLI commands

```bash
# Start a new task (creates TAP in in_progress)
node skills/provenancecode/scripts/pc-exec.mjs tap new "Task title"

# Finish a task (transitions TAP to completed/failed)
node skills/provenancecode/scripts/pc-exec.mjs tap done TAP-000001

# Validate all TAPs
npx prvc validate --track runtime
```

### Minimal TAP example

```json
{
  "schema": "provenancecode.tap.v1",
  "id": "TAP-000001",
  "title": "Add approval flow to Conductor UI",
  "version": 1,
  "lifecycle": { "state": "in_progress" },
  "timestamps": { "started_at": "2026-06-23T14:00:00Z" },
  "runtime": { "agent": "cursor", "model": "claude-sonnet-4-5" },
  "git": { "branch": "feat/approval-flow" },
  "task": { "outcome": "succeeded" },
  "risk": { "needs_human_review": false },
  "enforcement": { "validated": false }
}
```

---

## ACT — Action Record

### When to create an ACT

Create an ACT for **every governed tool call** that goes through PDP evaluation. High-sensitivity actions (file writes, shell exec, deploys) MUST have one. The ACT links back to its parent TAP via `links.task`.

### File location

```
provenance/actions/ACT-XXXXXX/
  action.json              (REQUIRED)
  action.md                (RECOMMENDED for STEP_UP)
  change-set.json          (REQUIRED if governed change set applied)
  approval.receipt.json    (REQUIRED if STEP_UP approved)
  /evidence/               (OPTIONAL)
```

### ID format

New ACTs: `ACT-{SEQ6}` — check `provenance/actions/` for existing folders and increment.

### Required fields

| Field | Description |
|---|---|
| `schema` | `"provenancecode.act.v1"` |
| `id` | ACT ID matching folder name |
| `title` | What the agent did |
| `version` | Integer, starts at 1 |
| `lifecycle.state` | Lifecycle state |
| `timestamps.requested_at` | When submitted to PDP |
| `timestamps.decided_at` | When PDP returned decision |
| `actors.agent` | `"cursor"` |
| `action.type` | Dot-notation type (e.g. `"file.write"`) |
| `action.resource` | Resource identifier |
| `policy.decision` | `ALLOW` / `DENY` / `STEP_UP` |
| `policy.policy_hash` | Hash of policy bundle evaluated |
| `execution.status` | `succeeded` / `failed` / `not_executed` |
| `links.task` | Parent TAP ID — REQUIRED |

### Policy decisions

| Decision | Meaning |
|---|---|
| `ALLOW` | Proceeds to execution |
| `DENY` | Blocked; `execution.status = not_executed` |
| `STEP_UP` | Requires human approval first |

### Validation rules

1. If `policy.decision = STEP_UP` and `lifecycle.state = executed` → `approval.approved_by` MUST be set
2. If `change_set` is present → `change_set.content_hash` MUST be set
3. `links.task` MUST reference a valid `TAP-*` ID
4. If `lifecycle.state = denied` or `rejected` → `execution.status` MUST be `not_executed`
5. Executor MUST verify `approved_content_hash` matches `sha256(canonical({ changes, environment, risk_level }))` before executing STEP_UP actions

### CLI commands

```bash
# Record a new governed action
node skills/provenancecode/scripts/pc-exec.mjs act new file.write path/to/file.ts TAP-000001

# Record a shell execution
node skills/provenancecode/scripts/pc-exec.mjs act new shell.exec "git commit" TAP-000001
```

---

## MEO — Memory Evidence Object

### When to create a MEO

Create a **working** MEO at the end of any TAP where the agent learned something significant. Create a **dream** MEO during offline consolidation events (synthesising across multiple TAPs).

MEOs are the git-native layer on top of the `.learnings/` markdown files — `content.key_facts` is the structured form of what lives in `.learnings/LEARNINGS.md`.

### File location

```
provenance/memories/MEO-XXXXXX/
  memory.json          (REQUIRED)
  memory.md            (RECOMMENDED)
  consolidation.json   (REQUIRED for dream subtype)
  /evidence/           (OPTIONAL)
```

### ID format

New MEOs: `MEO-{SEQ6}` — check `provenance/memories/` for existing folders and increment.

### Required fields

| Field | Description |
|---|---|
| `schema` | `"provenancecode.meo.v1"` |
| `id` | MEO ID matching folder name |
| `title` | Memory topic |
| `version` | Integer, starts at 1 |
| `subtype` | `working` or `dream` |
| `lifecycle.state` | `active` for new memories |
| `timestamps.created_at` | ISO 8601 |
| `runtime.agent` | `"cursor"` |
| `scope.domain` | Primary domain (e.g. `"conductor-ui"`) |
| `content.summary` | What was learned |
| `content.confidence` | `high` / `medium` / `low` / `speculative` |
| `provenance.source` | `task` / `dream` / `human` / `import` |
| `provenance.source_quality` | `human-reviewed` / `agent-observed` / etc. |

**Additionally for `subtype: dream`:**
- `consolidation.inputs.tasks` (min 1 TAP ID)
- `consolidation.synthesis_method`
- `timestamps.consolidated_at`

### Lifecycle states

`forming` → `active` → `stale` → `consolidated` / `pruned` → `archived`

### Subtypes

| Subtype | When | `consolidation` block |
|---|---|---|
| `working` | End of a TAP | Not present |
| `dream` | Offline consolidation | Required |

### Confidence levels

`high` | `medium` | `low` | `speculative`

### Validation rules

1. `links.written_by_task` MUST reference a valid `TAP-*` ID if `subtype = working`
2. If `lifecycle.state = pruned` → `links.consolidated_into` MUST reference a `MEO-*` ID
3. If `subtype = dream` → `consolidation` block MUST be present
4. If `lifecycle.supersedes` is set → referenced MEO MUST exist and its `superseded_by` MUST point back

### CLI commands

```bash
# Record new working memory after a task
node skills/provenancecode/scripts/pc-exec.mjs meo new "Conductor approval flow" conductor-ui TAP-000001

# Run a dream consolidation
node skills/provenancecode/scripts/pc-exec.mjs meo dream --tasks TAP-000001,TAP-000002,TAP-000003
```

---

**ProvenanceCode Standard v2.0** — Repo Governance (DEO/RA) + Runtime Governance (TAP/ACT/MEO)  
[Standard Reference](https://provenancecode.github.io/ProvenanceCode/standard/)
