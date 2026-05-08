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
 * Generate Cursor rules content
 */
function generateCursorRules(config: any): string {
  return `# ProvenanceCode G2 Rules for Cursor

## Overview

This project uses ProvenanceCode G2 (v2.0) for decision and risk tracking.

**Configuration:**
- App Code: ${config.defaultAppCode}
- Default Area: ${config.defaultArea}
- ID Format: ${config.idScheme}
- Risk ID Format: ${config.riskIdScheme}

## Decision Record Creation

When creating ProvenanceCode decision records:

### 1. Use G2 Schema
All decisions must reference: \`https://provenancecode.org/schemas/decision.g2.schema.json\`

### 2. ID Format
\`${config.idScheme.replace('{APP}', config.defaultAppCode).replace('{AREA}', config.defaultArea)}\`

Auto-increment the sequence number by checking existing files in \`${config.paths.decisions}\`

### 3. Required Fields
- \`schema\`: G2 schema URL
- \`decision_id\`: Properly formatted ID
- \`title\`: Brief, descriptive title
- \`status\`: Default to "draft"
- \`context\`: Why this decision is needed
- \`decision\`: What was decided

### 4. Status Values
\`draft\` | \`proposed\` | \`accepted\` | \`rejected\` | \`deprecated\` | \`superseded\`

### 5. Best Practices
- ✅ Link PRs and issues in the \`links\` array
- ✅ Document consequences (positive and negative)
- ✅ Assess risks
- ✅ Keep records atomic and focused
- ✅ Use the CLI: \`npx prvc journal add "Title"\`

## Risk Record Creation

When creating risk records:

### 1. Use G2 Schema
\`https://provenancecode.org/schemas/risk.g2.schema.json\`

### 2. ID Format
\`${config.riskIdScheme.replace('{APP}', config.defaultAppCode).replace('{AREA}', config.defaultArea)}\`

### 3. Severity Levels
\`low\` | \`medium\` | \`high\` | \`critical\`

### 4. Status Values
\`open\` | \`monitoring\` | \`mitigated\` | \`accepted\` | \`closed\`

### 5. Link Decisions
Use \`linked_decisions\` array to reference related decision IDs

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
npx prvc show DEC-${config.defaultAppCode}-${config.defaultArea}-000001
\`\`\`

## Important Notes

- ⚠️ Do NOT enforce approval workflows (CLI doesn't do governance)
- ⚠️ Do NOT block PRs based on decision status
- ✅ DO validate JSON schema compliance
- ✅ DO encourage linking related records
- ✅ DO default to "draft" status for new records

## Templates Available

Use \`npx prvc template list\` to see all templates:
- architecture
- security
- tech-debt
- api
- database
- tooling
- performance

## Example Decision

\`\`\`json
{
  "schema": "https://provenancecode.org/schemas/decision.g2.schema.json",
  "decision_id": "DEC-${config.defaultAppCode}-${config.defaultArea}-000001",
  "title": "Use PostgreSQL for main database",
  "status": "draft",
  "context": "Need reliable ACID-compliant database",
  "decision": "We will use PostgreSQL as our primary database",
  "consequences": "Strong consistency, mature tooling, but need careful schema migrations",
  "risk": "Potential scaling challenges at very high volumes",
  "links": []
}
\`\`\`

---

**ProvenanceCode CLI** - Making decision documentation effortless
`;
}

/**
 * Generate Claude rules content
 */
function generateClaudeRules(config: any): string {
  return `# ProvenanceCode G2 - Claude Code Assistant

## Configuration
- **App Code:** ${config.defaultAppCode}
- **Default Area:** ${config.defaultArea}
- **Decision Format:** ${config.idScheme}
- **Risk Format:** ${config.riskIdScheme}

## Your Role

When asked to create decisions or risks:

1. ✅ Generate valid G2-compliant JSON
2. ✅ Auto-increment sequence numbers
3. ✅ Set "draft" as default status
4. ✅ Include all required fields
5. ✅ Suggest linking related PRs/issues
6. ❌ Do NOT enforce approval workflows
7. ❌ Do NOT manage governance

## Quick Commands

\`\`\`bash
npx prvc journal add "Decision title"
npx prvc template use architecture
npx prvc validate
npx prvc quality
\`\`\`

See \`.cursor/rules/provenancecode.md\` for full documentation.
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
# ProvenanceCode Session Start
# Checks API health and auto-registers the Cursor agent on session start.
# Installed by: prvc starterpack add cursor

API_URL="\${PROVENANCECODE_API_URL:-http://127.0.0.1:3001/v1}"
API_KEY="\${PROVENANCECODE_PAT:-}"
TENANT_ID="\${PROVENANCECODE_TENANT_ID:-tenant-dev}"
AGENT_ID="\${PROVENANCECODE_AGENT_ID:-agent-cursor}"
DASHBOARD_URL="\${PROVENANCECODE_DASHBOARD_URL:-http://127.0.0.1:3002}"

health="\$(curl -s -m 3 "\${API_URL}/health" 2>/dev/null)" || true

if [[ -z "\$health" ]]; then
  cat <<'EOF'
additional_context: |
  ProvenanceCode API is not reachable. Governance hooks are inactive.
  Start the API and restart Cursor to enable enforcement.
EOF
  exit 0
fi

# Auto-register agent if not yet registered
reg="\$(curl -s -m 5 -X POST "\${API_URL}/agents" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: \${API_KEY}" \\
  -d "{\\"tenantId\\":\\"\${TENANT_ID}\\",\\"agentId\\":\\"\${AGENT_ID}\\",
       \\"name\\":\\"Cursor Agent\\",\\"type\\":\\"cursor\\",
       \\"capabilities\\":[\\"aws.*\\",\\"infra.*\\",\\"project.*\\",\\"deploy.*\\",\\"file.*\\"]}" 2>/dev/null)" || true

cat <<EOF
additional_context: |
  ProvenanceCode governance is ACTIVE.
  - API: \${API_URL}
  - Agent: \${AGENT_ID} (tenant: \${TENANT_ID})
  - Dashboard: \${DASHBOARD_URL}
  - Governed commands: aws, kubectl, terraform, helm, gcloud
  All matching shell commands will be policy-checked before execution.
EOF
`;
}

/**
 * Generate Antigravity rules content
 */
function generateAntigravityRules(config: any): string {
  return `# ProvenanceCode G2 - Antigravity Integration

## Quick Reference

- **Decision ID:** ${config.idScheme}
- **Risk ID:** ${config.riskIdScheme}
- **App Code:** ${config.defaultAppCode}
- **Default Area:** ${config.defaultArea}

## Schemas

- Decision: https://provenancecode.org/schemas/decision.g2.schema.json
- Risk: https://provenancecode.org/schemas/risk.g2.schema.json

## Status Values

**Decisions:** draft, proposed, accepted, rejected, deprecated, superseded
**Risks:** open, monitoring, mitigated, accepted, closed

## CLI Commands

\`\`\`bash
npx prvc journal add "Title"
npx prvc template list
npx prvc validate
npx prvc quality
\`\`\`

## Boundary

This is the OPEN layer - record creation and validation only.
Governance enforcement is handled by the ProvenanceCode GitHub App.
`;
}


