import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';

/**
 * Starterpack command - Install AI starter packs to proper IDE locations
 */
export function starterpackCommand(baseDir: string, action: string, tool: string): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not installed in this directory.'));
    console.log(chalk.gray('   Run: npx prvc install'));
    process.exit(1);
  }

  if (action !== 'add') {
    console.log(chalk.red(`Unknown action: ${action}`));
    console.log(chalk.gray('Available: add'));
    process.exit(1);
  }

  switch (tool.toLowerCase()) {
    case 'cursor':
      installCursorPack(baseDir, config);
      break;
    case 'claude':
      installClaudePack(baseDir, config);
      break;
    case 'antigravity':
      installAntigravityPack(baseDir, config);
      break;
    default:
      console.log(chalk.red(`Unknown starter pack: ${tool}`));
      console.log(chalk.gray('Available: cursor, claude, antigravity'));
      process.exit(1);
  }
}

/**
 * Install Cursor starter pack to .cursor/rules, .cursor/hooks, and .cursor/mcp.json
 */
function installCursorPack(baseDir: string, config: any): void {
  console.log(chalk.blue('🤖 Installing Cursor starter pack...'));
  console.log();

  const cursorDir = path.join(baseDir, '.cursor');
  const rulesDir = path.join(cursorDir, 'rules');
  const hooksDir = path.join(cursorDir, 'hooks');

  fs.ensureDirSync(rulesDir);
  fs.ensureDirSync(hooksDir);

  const created: string[] = [];

  // ── Cursor rules (decision documentation) ──────────────────────────────
  const rulesPath = path.join(rulesDir, 'provenancecode.md');
  fs.writeFileSync(rulesPath, generateCursorRules(config));
  created.push(path.relative(baseDir, rulesPath));

  // ── hooks.json — merge with existing so other hooks are preserved ───────
  const hooksJsonPath = path.join(cursorDir, 'hooks.json');
  const existingHooks = fs.existsSync(hooksJsonPath)
    ? (fs.readJsonSync(hooksJsonPath) as { version: number; hooks: Record<string, any[]> })
    : { version: 1, hooks: {} };

  const prvcSessionHook = { command: '.cursor/hooks/prvc-session-start.sh', timeout: 10 };
  const prvcShellHook = {
    command: '.cursor/hooks/prvc-shell-guard.sh',
    matcher: '^\\s*(aws|kubectl|terraform|helm|gcloud)\\s',
    failClosed: false,
    timeout: 35,
  };

  // Only add if not already present
  const sessionHooks: any[] = existingHooks.hooks['sessionStart'] ?? [];
  if (!sessionHooks.some((h: any) => h.command === prvcSessionHook.command)) {
    sessionHooks.push(prvcSessionHook);
  }
  const shellHooks: any[] = existingHooks.hooks['beforeShellExecution'] ?? [];
  if (!shellHooks.some((h: any) => h.command === prvcShellHook.command)) {
    shellHooks.push(prvcShellHook);
  }

  const mergedHooks = {
    ...existingHooks,
    hooks: { ...existingHooks.hooks, sessionStart: sessionHooks, beforeShellExecution: shellHooks },
  };
  fs.writeJsonSync(hooksJsonPath, mergedHooks, { spaces: 2 });
  created.push(path.relative(baseDir, hooksJsonPath));

  // ── Shell guard hook script ─────────────────────────────────────────────
  const shellGuardPath = path.join(hooksDir, 'prvc-shell-guard.sh');
  fs.writeFileSync(shellGuardPath, generateShellGuardScript());
  fs.chmodSync(shellGuardPath, 0o755);
  created.push(path.relative(baseDir, shellGuardPath));

  // ── Session start hook script ───────────────────────────────────────────
  const sessionStartPath = path.join(hooksDir, 'prvc-session-start.sh');
  fs.writeFileSync(sessionStartPath, generateSessionStartScript());
  fs.chmodSync(sessionStartPath, 0o755);
  created.push(path.relative(baseDir, sessionStartPath));

  // ── MCP server config (only if not already present) ────────────────────
  const mcpJsonPath = path.join(cursorDir, 'mcp.json');
  if (!fs.existsSync(mcpJsonPath)) {
    fs.writeJsonSync(mcpJsonPath, generateMcpConfig(), { spaces: 2 });
    created.push(path.relative(baseDir, mcpJsonPath));
  }

  // ── Output ──────────────────────────────────────────────────────────────
  console.log(chalk.green('✓ Cursor starter pack installed'));
  console.log();
  console.log(chalk.bold('Created:'));
  created.forEach(f => console.log(chalk.gray(`  ${f}`)));
  console.log();
  console.log(chalk.bold('What this does:'));
  console.log(chalk.gray('  • Tells Cursor how to create ProvenanceCode records'));
  console.log(chalk.gray('  • Provides G2 schema validation rules'));
  console.log(chalk.gray('  • Registers ProvenanceCode MCP tools (aws_cli_run, infra_*, project_*, deploy_*, file_*)'));
  console.log(chalk.gray('  • Adds shell governance hooks for aws, kubectl, terraform, helm, gcloud'));
  console.log(chalk.gray('  • Auto-registers the agent and checks API health on session start'));
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log(chalk.gray('  1. Set environment variables (or add to .env.local):'));
  console.log(chalk.gray('       PROVENANCECODE_API_URL   — API base URL'));
  console.log(chalk.gray('       PROVENANCECODE_PAT        — Personal Access Token'));
  console.log(chalk.gray('       PROVENANCECODE_TENANT_ID  — Your tenant ID'));
  console.log(chalk.gray('       PROVENANCECODE_DASHBOARD_URL — Dashboard URL (for ledger links)'));
  console.log(chalk.gray('  2. Restart Cursor to activate the hooks and MCP server'));
  console.log(chalk.gray('  3. Ask Cursor: "Create a decision for choosing Redis"'));
  console.log();
}

/**
 * Install Claude starter pack
 */
function installClaudePack(baseDir: string, config: any): void {
  console.log(chalk.blue('🤖 Installing Claude Code starter pack...'));
  console.log();

  const claudeDir = path.join(baseDir, '.claude');
  fs.ensureDirSync(claudeDir);

  const content = generateClaudeRules(config);
  const filePath = path.join(claudeDir, 'provenancecode.md');
  
  fs.writeFileSync(filePath, content);

  console.log(chalk.green('✓ Claude starter pack installed'));
  console.log();
  console.log(chalk.bold('Created:'));
  console.log(chalk.gray(`  ${path.relative(baseDir, filePath)}`));
  console.log();
}

/**
 * Install Antigravity starter pack
 */
function installAntigravityPack(baseDir: string, config: any): void {
  console.log(chalk.blue('🤖 Installing Antigravity starter pack...'));
  console.log();

  const agDir = path.join(baseDir, '.antigravity');
  fs.ensureDirSync(agDir);

  const content = generateAntigravityRules(config);
  const filePath = path.join(agDir, 'provenancecode.md');
  
  fs.writeFileSync(filePath, content);

  console.log(chalk.green('✓ Antigravity starter pack installed'));
  console.log();
  console.log(chalk.bold('Created:'));
  console.log(chalk.gray(`  ${path.relative(baseDir, filePath)}`));
  console.log();
}

/**
 * Generate Cursor rules content — ProvenanceCode Standard v2.0
 */
function generateCursorRules(config: any): string {
  const project: string = config.id_format?.project ?? config.defaultAppCode ?? 'MYAPP';
  const subproject: string = config.id_format?.subproject ?? config.defaultArea ?? 'CORE';
  const decisionsPath: string = config.paths?.decisions ?? 'provenance/decisions';
  const tasksPath: string = config.paths?.tasks ?? 'provenance/tasks';
  const actionsPath: string = config.paths?.actions ?? 'provenance/actions';
  const memoriesPath: string = config.paths?.memories ?? 'provenance/memories';

  return `# ProvenanceCode Artifact Rules for Cursor

## Overview

This project uses the **ProvenanceCode Standard v2.0** with two artifact tracks:

| Track | Version | Artifacts |
|---|---|---|
| Repo Governance | v1.x | DEO (decisions), RA (risks) |
| Runtime Governance | v2.0 | TAP (tasks), ACT (actions), MEO (memories) |

**Configuration:**
- Standard: ProvenanceCode v2.0
- ID Style: hierarchical
- Project: ${project}
- Default Subproject: ${subproject}
- Decision ID Format: \`DEC-${project}-${subproject}-{SEQ7}\` (7-digit zero-padded)
- Risk ID Format: \`RA-{PROJECT}-{SUBPROJECT}-{SEQ6}\`
- TAP ID Format: \`TAP-{SEQ6}\` (simple) or \`TAP-{PROJECT}-{SUBPROJECT}-{SEQ6}\` (hierarchical)
- ACT ID Format: \`ACT-{SEQ6}\` or \`ACT-{PROJECT}-{SUBPROJECT}-{SEQ6}\`
- MEO ID Format: \`MEO-{SEQ6}\` or \`MEO-{PROJECT}-{AGENT}-{SEQ6}\`

## Decision Record Creation

When creating ProvenanceCode decision records:

### 1. Schema Identifier

All decisions MUST use: \`"schema": "provenancecode.decision.v1"\`

### 2. ID Format

New decisions: \`DEC-${project}-${subproject}-{SEQ7}\` — auto-increment by checking existing files in \`${decisionsPath}/\`.

The folder name MUST match the \`id\` field (e.g. \`${decisionsPath}/DEC-${project}-${subproject}-0000001/decision.json\`).

### 3. Required Fields

| Field | Description |
|---|---|
| \`schema\` | \`"provenancecode.decision.v1"\` |
| \`id\` | Properly formatted decision ID |
| \`title\` | Brief, descriptive title (max 120 chars) |
| \`version\` | Integer, starts at 1 |
| \`lifecycle.state\` | One of: \`draft\`, \`proposed\`, \`accepted\`, \`rejected\`, \`superseded\` |
| \`timestamps.created_at\` | ISO 8601 timestamp |
| \`actors.author\` | Author username or identifier |
| \`outcome\` | What was decided |
| \`rationale\` | Why this was chosen |
| \`risk.level\` | One of: \`low\`, \`medium\`, \`high\`, \`critical\` |

### 4. Lifecycle States

\`draft\` → \`proposed\` → \`accepted\` → \`superseded\`

\`draft\` → \`proposed\` → \`rejected\` (terminal)

\`accepted\` decisions MUST NOT be edited — create a new decision and mark old as \`superseded\`.

### 5. AI Attribution

Use \`actors.bot\` for AI-assisted drafts:
- \`"cursor-ai"\` for Cursor
- \`"kiro"\` for Kiro
- \`"claude-code"\` for Claude Code

### 6. Best Practices

- ✅ Link PRs and issues in \`links.pr\` and \`links.issues\`
- ✅ List alternatives in \`options\`
- ✅ Describe why in \`rationale\`
- ✅ Set \`actors.bot\` when AI drafted the decision
- ✅ Keep records atomic and focused
- ✅ Use the CLI: \`npx prvc journal add "Title"\`

## Risk Record Creation

### 1. ID Format

\`RA-{PROJECT}-{SUBPROJECT}-{SEQ6}\`

### 2. Severity Levels

\`low\` | \`medium\` | \`high\` | \`critical\`

### 3. Status Values

\`open\` | \`monitoring\` | \`mitigated\` | \`accepted\` | \`closed\`

### 4. Link Decisions

Reference related decision IDs in \`links.decisions\`.

## CLI Commands

\`\`\`bash
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
npx prvc show DEC-${project}-${subproject}-0000001
\`\`\`

## Important Notes

- ⚠️ Do NOT enforce approval workflows (CLI doesn't do governance)
- ⚠️ Do NOT block PRs based on decision status
- ✅ DO validate JSON schema compliance
- ✅ DO encourage linking related records
- ✅ DO default to \`"draft"\` for new records

## Minimal Valid DEO Example

\`\`\`json
{
  "schema": "provenancecode.decision.v1",
  "id": "DEC-${project}-${subproject}-0000001",
  "title": "Use PostgreSQL for main database",
  "version": 1,
  "lifecycle": {
    "state": "draft"
  },
  "timestamps": {
    "created_at": "2026-06-24T09:00:00Z"
  },
  "actors": {
    "author": "your-username"
  },
  "outcome": "Use PostgreSQL as our primary database.",
  "rationale": "Strong ACID compliance, mature tooling, and team familiarity.",
  "risk": {
    "level": "low"
  }
}
\`\`\`

---

## TAP — Task Attestation/Provenance

### When to create a TAP

Create a TAP **at the start of every agent task** that touches code, configuration, or infrastructure. The TAP lifecycle: \`in_progress\` → \`completed\` / \`blocked\` / \`failed\`.

### File location

\`\`\`
${tasksPath}/TAP-XXXXXX/
  task.json          (REQUIRED)
  task.md            (RECOMMENDED)
  attestation.json   (OPTIONAL — for signed tasks)
  /evidence/         (OPTIONAL)
\`\`\`

### Required fields

| Field | Description |
|---|---|
| \`schema\` | \`"provenancecode.tap.v1"\` |
| \`id\` | TAP ID matching folder name |
| \`title\` | Task title from the prompt |
| \`version\` | Integer, starts at 1 |
| \`lifecycle.state\` | \`in_progress\` at start; update at end |
| \`timestamps.started_at\` | ISO 8601 when task began |
| \`runtime.agent\` | \`"cursor"\` |
| \`runtime.model\` | Active model (e.g. \`"claude-sonnet-4-5"\`) |
| \`git.branch\` | Active git branch |
| \`task.outcome\` | \`succeeded\` / \`failed\` / \`blocked\` / \`partial\` |
| \`risk.needs_human_review\` | \`true\` if any high/critical risks open |
| \`enforcement.validated\` | \`true\` after validation passes |

### CLI commands

\`\`\`bash
# Start a new task
npx prvc tap new "Task title"

# Close a task (transition to completed/failed)
npx prvc tap done TAP-000001

# List recent tasks
npx prvc tap list --recent 10

# Validate all TAPs
npx prvc validate --track runtime
\`\`\`

---

## ACT — Action Record

### When to create an ACT

Create an ACT for **every governed tool call** that goes through PDP evaluation. High-sensitivity actions (file writes, shell exec, deploys) MUST have one. The ACT links back to its parent TAP via \`links.task\`.

### File location

\`\`\`
${actionsPath}/ACT-XXXXXX/
  action.json              (REQUIRED)
  action.md                (RECOMMENDED for STEP_UP)
  change-set.json          (REQUIRED if governed change set applied)
  approval.receipt.json    (REQUIRED if STEP_UP approved)
  /evidence/               (OPTIONAL)
\`\`\`

### Policy decisions

| Decision | Meaning |
|---|---|
| \`ALLOW\` | Proceeds to execution |
| \`DENY\` | Blocked; \`execution.status = not_executed\` |
| \`STEP_UP\` | Requires human approval first |

### CLI commands

\`\`\`bash
# Record a new governed action
npx prvc act new "Action description" --action-type file.write --resource path/to/file.ts --task TAP-000001

# Record a shell execution
npx prvc act new "Run git commit" --action-type shell.exec --resource "git commit" --task TAP-000001
\`\`\`

---

## MEO — Memory Evidence Object

### When to create a MEO

Create a **working** MEO at the end of any TAP where the agent learned something significant. Create a **dream** MEO during offline consolidation events (synthesising across multiple TAPs).

### File location

\`\`\`
${memoriesPath}/MEO-XXXXXX/
  memory.json          (REQUIRED)
  memory.md            (RECOMMENDED)
  consolidation.json   (REQUIRED for dream subtype)
  /evidence/           (OPTIONAL)
\`\`\`

### Lifecycle states

\`forming\` → \`active\` → \`stale\` → \`consolidated\` / \`pruned\` → \`archived\`

### CLI commands

\`\`\`bash
# Record new working memory after a task
npx prvc meo new "What was learned" --domain api-design --task TAP-000001

# Create a dream consolidation
npx prvc meo new "Consolidated auth patterns" --subtype dream --task TAP-000001,TAP-000002,TAP-000003
\`\`\`

---

**ProvenanceCode Standard v2.0** — Repo Governance (DEO/RA) + Runtime Governance (TAP/ACT/MEO)
`;
}

/**
 * Generate Claude rules content — ProvenanceCode Standard v2.0
 */
function generateClaudeRules(config: any): string {
  const project: string = config.id_format?.project ?? config.defaultAppCode ?? 'MYAPP';
  const subproject: string = config.id_format?.subproject ?? config.defaultArea ?? 'CORE';

  return `# ProvenanceCode Standard v2.0 — Claude Code Assistant

## Configuration
- **Project:** ${project}
- **Subproject:** ${subproject}
- **Decision Format:** \`DEC-${project}-${subproject}-{SEQ7}\`
- **Risk Format:** \`RA-${project}-${subproject}-{SEQ6}\`

## Artifact tracks

| Track | Artifacts |
|---|---|
| Repo Governance | DEO (decisions), RA (risks), SPEC, MR |
| Runtime Governance | TAP (tasks), ACT (actions), MEO (memories) |

## Your Role

When asked to create ProvenanceCode records:

1. ✅ Use \`"schema": "provenancecode.decision.v1"\` for decisions (NOT the G2 URL)
2. ✅ Auto-increment sequence numbers by checking existing folders
3. ✅ Set \`"draft"\` as default \`lifecycle.state\` for new decisions
4. ✅ Include all required fields (see \`.cursor/rules/provenancecode.md\`)
5. ✅ Set \`actors.bot\` when AI drafted a decision
6. ✅ Link TAPs → ACTs → MEOs for runtime governance
7. ❌ Do NOT enforce approval workflows
8. ❌ Do NOT block on policy decisions — that is handled server-side

## Quick Commands

\`\`\`bash
npx prvc journal add "Decision title"
npx prvc tap new "Task title"
npx prvc tap done TAP-000001
npx prvc act new "Action" --task TAP-000001
npx prvc meo new "Memory" --task TAP-000001
npx prvc validate
npx prvc quality
\`\`\`
`;
}

/**
 * Generate .cursor/mcp.json for the ProvenanceCode MCP server
 */
function generateMcpConfig(): object {
  return {
    mcpServers: {
      provenancecode: {
        command: 'npx',
        args: ['-y', '@provenancecode/mcp-server'],
        env: {
          PROVENANCECODE_API_URL: '${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}',
          PROVENANCECODE_PAT: '${PROVENANCECODE_PAT}',
          PROVENANCECODE_TENANT_ID: '${PROVENANCECODE_TENANT_ID:-tenant-dev}',
          PROVENANCECODE_AGENT_ID: '${PROVENANCECODE_AGENT_ID:-agent-cursor}',
          PROVENANCECODE_DASHBOARD_URL: '${PROVENANCECODE_DASHBOARD_URL:-http://127.0.0.1:3002}',
        },
      },
    },
  };
}

/**
 * Generate the beforeShellExecution hook script
 */
function generateShellGuardScript(): string {
  return `#!/usr/bin/env bash
# ProvenanceCode Shell Guard
# Intercepts governed CLI commands and enforces policy before execution.
# Installed by: prvc starterpack add cursor

set -euo pipefail

API_URL="\${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}"
API_KEY="\${PROVENANCECODE_PAT:-}"
TENANT_ID="\${PROVENANCECODE_TENANT_ID:-tenant-dev}"
AGENT_ID="\${PROVENANCECODE_AGENT_ID:-agent-cursor}"
DASHBOARD_URL="\${PROVENANCECODE_DASHBOARD_URL:-http://127.0.0.1:3002}"
COMMAND="\${CURSOR_SHELL_COMMAND:-}"

if [[ -z "\$COMMAND" ]]; then
  echo '{"action":"allow"}'
  exit 0
fi

# Map shell tool → ProvenanceCode action prefix
detect_action() {
  local cmd="\$1"
  local tool
  tool="\$(echo "\$cmd" | awk '{print \$1}')"
  case "\$tool" in
    aws)      echo "aws.\$(echo "\$cmd" | awk '{print \$2}')" ;;
    kubectl)  echo "infra.kubectl" ;;
    terraform)echo "infra.terraform" ;;
    helm)     echo "infra.helm" ;;
    gcloud)   echo "infra.gcloud" ;;
    *)        echo "shell.run" ;;
  esac
}

ACTION_NAME="\$(detect_action "\$COMMAND")"

PAYLOAD="\$(jq -n \\
  --arg tenantId "\$TENANT_ID" \\
  --arg agentId  "\$AGENT_ID" \\
  --arg action   "\$ACTION_NAME" \\
  --arg cmd      "\$COMMAND" \\
  '{tenantId:\$tenantId, agentId:\$agentId, action:\$action,
    input:{command:\$cmd, source:"cursor-shell-hook"}}')"

RESPONSE="\$(curl -s -m 8 -X POST "\${API_URL}/actions" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: \${API_KEY}" \\
  -d "\$PAYLOAD" 2>/dev/null)" || true

if [[ -z "\$RESPONSE" ]]; then
  # API unreachable — fail open
  echo '{"action":"allow"}'
  exit 0
fi

DECISION="\$(echo "\$RESPONSE" | jq -r '.policy_decision // "ALLOW"')"
ACTION_ID="\$(echo "\$RESPONSE" | jq -r '.id // ""')"

case "\$DECISION" in
  DENY)
    REASON="\$(echo "\$RESPONSE" | jq -r '.reason // "Policy denied this command."')"
    echo "{\"action\":\"deny\",\"message\":\"\$REASON\"}"
    ;;
  STEP_UP|REQUIRES_APPROVAL)
    echo "{\"action\":\"ask\",\"message\":\"ProvenanceCode requires approval for: \$COMMAND\\nReview at: \${DASHBOARD_URL}/actions/\${ACTION_ID}\"}"
    ;;
  *)
    # Log completion asynchronously and allow
    if [[ -n "\$ACTION_ID" ]]; then
      curl -s -m 5 -X PATCH "\${API_URL}/actions/\${ACTION_ID}/complete" \\
        -H "Content-Type: application/json" \\
        -H "x-api-key: \${API_KEY}" \\
        -d '{"status":"completed"}' &>/dev/null &
    fi
    echo '{"action":"allow"}'
    ;;
esac
`;
}

/**
 * Generate the sessionStart hook script
 */
function generateSessionStartScript(): string {
  return `#!/usr/bin/env bash
# ProvenanceCode session start hook
# Checks the API is reachable and registers the Cursor agent if needed.
# Fails open — a non-responsive API should never block Cursor from opening.

set -euo pipefail

PRVC_API="\${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}"
PRVC_KEY="\${PROVENANCECODE_PAT:-dev-key}"
PRVC_TENANT="\${PROVENANCECODE_TENANT_ID:-tenant-dev}"
PRVC_AGENT="\${PROVENANCECODE_AGENT_ID:-agent-cursor}"

# ── Check API health ─────────────────────────────────────────────────────────

health=\$(curl -sf --max-time 3 "\${PRVC_API}/health" 2>/dev/null) || {
  echo '{"additional_context":"ProvenanceCode API is not reachable. Shell governance and MCP tools will fail open until the API is available."}'
  exit 0
}

# ── Ensure this agent is registered ─────────────────────────────────────────

reg=\$(curl -sf --max-time 3 \\
  "\${PRVC_API}/agents/\${PRVC_TENANT}/\${PRVC_AGENT}" \\
  -H "x-api-key: \${PRVC_KEY}" 2>/dev/null) || reg=""

if [[ -z "\$reg" || "\$(echo "\$reg" | jq -r '.agentId // empty' 2>/dev/null)" == "" ]]; then
  curl -sf --max-time 5 \\
    -X POST "\${PRVC_API}/agents" \\
    -H "x-api-key: \${PRVC_KEY}" \\
    -H "Content-Type: application/json" \\
    -d "{
      \\"agentId\\": \\"\${PRVC_AGENT}\\",
      \\"tenantId\\": \\"\${PRVC_TENANT}\\",
      \\"name\\": \\"Cursor Agent (\${PRVC_AGENT})\\",
      \\"status\\": \\"active\\",
      \\"capabilities\\": [\\"aws.cli.run\\", \\"infra.*\\", \\"project.*\\", \\"deploy.*\\", \\"file.*\\", \\"k8s.*\\", \\"terraform.*\\", \\"helm.*\\", \\"gcloud.*\\"]
    }" > /dev/null 2>&1 || true
fi

api_status=\$(echo "\$health" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

echo "{\\"additional_context\\":\\"ProvenanceCode API: \${api_status}. Agent '\${PRVC_AGENT}' registered. Shell governance active for: aws, kubectl, terraform, helm, gcloud. MCP tools available via .cursor/mcp.json.\\"}"
exit 0
`;
}

/**
 * Generate Antigravity rules content — ProvenanceCode Standard v2.0
 */
function generateAntigravityRules(config: any): string {
  const project: string = config.id_format?.project ?? config.defaultAppCode ?? 'MYAPP';
  const subproject: string = config.id_format?.subproject ?? config.defaultArea ?? 'CORE';

  return `# ProvenanceCode Standard v2.0 — Antigravity Integration

## Quick Reference

- **Decision ID:** \`DEC-${project}-${subproject}-{SEQ7}\`
- **Risk ID:** \`RA-${project}-${subproject}-{SEQ6}\`
- **Task ID:** \`TAP-{SEQ6}\`
- **Action ID:** \`ACT-{SEQ6}\`
- **Memory ID:** \`MEO-{SEQ6}\`

## Schema identifiers

- Decision: \`provenancecode.decision.v1\`
- TAP: \`provenancecode.tap.v1\`
- ACT: \`provenancecode.act.v1\`
- MEO: \`provenancecode.meo.v1\`

## Lifecycle States

**Decisions:** \`draft\` → \`proposed\` → \`accepted\` → \`superseded\`
**Risks:** \`open\` | \`monitoring\` | \`mitigated\` | \`accepted\` | \`closed\`
**TAPs:** \`in_progress\` → \`completed\` | \`blocked\` | \`failed\`
**MEOs:** \`forming\` → \`active\` → \`stale\` → \`consolidated\` / \`pruned\`

## CLI Commands

\`\`\`bash
npx prvc journal add "Title"
npx prvc tap new "Task title"
npx prvc tap done TAP-000001
npx prvc validate
npx prvc quality
\`\`\`

## Boundary

This is the OPEN layer — record creation and validation only.
Governance enforcement is handled by the ProvenanceCode API and GitHub App.
`;
}


