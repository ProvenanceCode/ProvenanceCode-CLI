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
 * Install Cursor starter pack to .cursor/rules
 */
function installCursorPack(baseDir: string, config: any): void {
  console.log(chalk.blue('🤖 Installing Cursor starter pack...'));
  console.log();

  const cursorDir = path.join(baseDir, '.cursor');
  const rulesDir = path.join(cursorDir, 'rules');
  
  fs.ensureDirSync(rulesDir);

  const rulesContent = generateCursorRules(config);
  const rulesPath = path.join(rulesDir, 'provenancecode.md');
  
  fs.writeFileSync(rulesPath, rulesContent);

  console.log(chalk.green('✓ Cursor starter pack installed'));
  console.log();
  console.log(chalk.bold('Created:'));
  console.log(chalk.gray(`  ${path.relative(baseDir, rulesPath)}`));
  console.log();
  console.log(chalk.bold('What this does:'));
  console.log(chalk.gray('  • Tells Cursor how to create ProvenanceCode records'));
  console.log(chalk.gray('  • Provides G2 schema validation rules'));
  console.log(chalk.gray('  • Auto-suggests decision documentation'));
  console.log();
  console.log(chalk.bold('Usage:'));
  console.log(chalk.gray('  Ask Cursor: "Create a decision for choosing Redis"'));
  console.log(chalk.gray('  Cursor will generate a valid G2 decision record!'));
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

