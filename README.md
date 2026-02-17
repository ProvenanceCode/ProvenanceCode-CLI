# ProvenanceCode CLI (`prvc`)

[![npm version](https://img.shields.io/npm/v/provenancecode-cli.svg)](https://www.npmjs.com/package/provenancecode-cli)
[![npm downloads](https://img.shields.io/npm/dm/provenancecode-cli.svg)](https://www.npmjs.com/package/provenancecode-cli)
[![License](https://img.shields.io/npm/l/provenancecode-cli.svg)](https://github.com/provenancecode/prvc/blob/main/LICENSE)

**ProvenanceCode CLI** is the reference implementation for bootstrapping and validating ProvenanceCode G2 (v2.0) in developer repositories.

## 🎯 Purpose

The CLI enables developers to:

- ✅ Install and configure ProvenanceCode G2 (v2.0)
- ✅ Scaffold required folder structure
- ✅ Install schemas
- ✅ Generate decision and risk templates
- ✅ Validate records locally
- ✅ Add AI starter packs (Cursor, Claude Code, Antigravity)
- ✅ Optionally add non-blocking CI validation
- ✅ **NEW:** Quick decision journal for instant capture
- ✅ **NEW:** Beautiful visualizations (graphs, timelines, stats)
- ✅ **NEW:** Smart templates for common decision types
- ✅ **NEW:** Powerful search and discovery
- ✅ **NEW:** Export to HTML, Markdown, Confluence, Notion, PDF
- ✅ **NEW:** Quality scoring and impact analysis

## ✨ What's New in v1.0

We've added **8 powerful features** that make ProvenanceCode irresistible for developers:

1. **📝 Decision Journal** - Capture decisions instantly like a developer diary
2. **📊 Visualizations** - Generate beautiful interactive graphs, timelines, and stats
3. **📋 Smart Templates** - 7 opinionated templates for common decisions
4. **🔍 Search & Discovery** - Find decisions fast with fuzzy search
5. **📤 Export Anywhere** - HTML, Markdown, Confluence, Notion, JSON, PDF
6. **📈 Quality Scoring** - Gamified metrics for decision documentation
7. **🎯 Impact Analysis** - Understand the blast radius of decisions
8. **🚀 Upgrade Info** - Learn about team features in the GitHub App

See [FEATURES.md](FEATURES.md) for detailed documentation.

**Quick examples:**

```bash
# Quick journal entry
npx prvc journal add "Use Redis for caching"

# Create from template
npx prvc template use architecture

# Visualize your decisions
npx prvc visualize graph

# Check your quality score
prvc quality

# Export to share
npx prvc export --format=html --theme=dark
```

> **Note:** All examples use `npx prvc` (no installation required). If you install globally with `npm install -g provenancecode-cli`, you can use `prvc` directly. See [USAGE.md](USAGE.md) for details.

## 🚫 What the CLI Does NOT Do

The CLI does **NOT**:

- ❌ Enforce governance workflows
- ❌ Block PR merges
- ❌ Manage approval state
- ❌ Provide dashboards
- ❌ Track decision velocity

**The CLI enables adoption. The [ProvenanceCode GitHub App](https://provenancecode.org) governs.**

## 📦 Installation

```bash
# Run directly with npx (recommended - no installation needed)
npx prvc init

# Or install globally (then use 'prvc' instead of 'npx prvc')
npm install -g provenancecode-cli
prvc init
```

**See [USAGE.md](USAGE.md) for detailed installation and usage instructions.**

## 🚀 Quick Start

```bash
# Simple install (just the structure)
npx prvc install

# Configure your project
npx prvc config set --app-code=MYAPP --area=CORE

# Add Cursor IDE integration
npx prvc starterpack add cursor

# Start documenting
npx prvc journal add "Your first decision"

# OR use full init (with AI and CI)
npx prvc init --app-code=MYAPP --ai=cursor,claude --ci=github
```

## 📖 Core Commands

### `prvc install` ⭐ NEW

Install ProvenanceCode structure in your project root (simplest way to get started).

```bash
npx prvc install
```

If `provenance/` already exists, `install` now runs a safe in-place v1 → v2 migration/repair instead of failing.

**Creates:**
- `provenance/` folder structure
- Schema files
- Config file
- Templates

### `prvc migrate`

Migrate an existing v1 repository to v2 format and ensure required folders/files exist.

```bash
npx prvc migrate
```

### `prvc config` ⭐ NEW

Configure ProvenanceCode settings.

```bash
# Set app code and area
npx prvc config set --app-code=MYAPP --area=BACKEND

# List current config
npx prvc config list

# Configure for monorepo
npx prvc config monorepo --roots="packages/frontend,packages/backend"

# Add/remove monorepo roots
npx prvc config monorepo --add-root="packages/new-service"
npx prvc config monorepo --remove-root="packages/old-service"
```

### `prvc starterpack` ⭐ NEW

Install AI starter packs to proper IDE locations.

```bash
# Install Cursor rules (goes to .cursor/rules/)
npx prvc starterpack add cursor

# Install Claude Code rules (goes to .claude/)
npx prvc starterpack add claude

# Install Antigravity rules (goes to .antigravity/)
npx prvc starterpack add antigravity
```

**What it does:**
- Creates IDE-specific configuration files
- Tells your AI assistant how to create ProvenanceCode records
- Uses your project's app code and area settings
- Installs in the proper location for each IDE

## 📖 Commands

### `prvc init`

Initialize ProvenanceCode G2 in your repository.

**Options:**

- `--standard=g2` - Standard version (default: g2)
- `--app-code=MYAPP` - Application code for ID generation (default: MYAPP)
- `--area=CORE` - Default area for records (default: CORE)
- `--ai=cursor,claude,antigravity` - AI starter packs to install
- `--ci=github` - CI provider to configure
- `--ci-mode=warn|fail` - CI validation mode (default: warn)
- `--force` - Force reinitialize if already exists

**Example:**

```bash
npx prvc init \
  --app-code=MYAPP \
  --area=CORE \
  --ai=cursor,claude \
  --ci=github \
  --ci-mode=warn
```

**Creates:**

```
/provenance/
  /decisions/
    TEMPLATE.json
  /risks/
    TEMPLATE.json
  /schemas/
    decision.g2.schema.json
    risk.g2.schema.json
  /ai/
    /cursor/
    /claude/
    /antigravity/
  provenance.config.json
  README.md
```

### `prvc validate`

Validate all ProvenanceCode records in the current repository.

**Options:**

- `--mode=warn|fail` - Validation mode (overrides config)

**Example:**

```bash
# Warn on errors but don't fail
npx prvc validate --mode=warn

# Fail on errors (useful for CI)
npx prvc validate --mode=fail
```

### `prvc starter`

Manage AI starter packs.

**Usage:**

```bash
npx prvc starter add <tool>
```

**Supported tools:**

- `cursor` - Cursor IDE rules and prompts
- `claude` - Claude Code assistant guidelines
- `antigravity` - Antigravity integration guide

**Example:**

```bash
npx prvc starter add cursor
```

## 🆔 ID Scheme (G2)

### Decision IDs

Format: `DEC-{APP}-{AREA}-{000001}`

Example: `DEC-MYAPP-CORE-000001`

### Risk IDs

Format: `RSK-{APP}-{AREA}-{000001}`

Example: `RSK-MYAPP-SECURITY-000003`

The CLI auto-increments `SEQ6` per area.

## 📝 Templates

### Decision Template

```json
{
  "schema": "https://provenancecode.org/schemas/decision.g2.schema.json",
  "decision_id": "",
  "title": "",
  "status": "draft",
  "context": "",
  "decision": "",
  "consequences": "",
  "risk": "",
  "links": []
}
```

### Risk Template

```json
{
  "schema": "https://provenancecode.org/schemas/risk.g2.schema.json",
  "risk_id": "",
  "title": "",
  "description": "",
  "severity": "medium",
  "status": "open",
  "linked_decisions": []
}
```

## ✅ Validation

The CLI validates:

- ✅ JSON syntax
- ✅ Schema compliance
- ✅ Required fields
- ✅ Enum values
- ✅ ID format
- ✅ Schema URL matches G2

The CLI does **NOT** enforce:

- ❌ Status transition rules
- ❌ Approval requirements
- ❌ Multi-party validation

### Validation Modes

**`warn` (default)**: Print errors but exit with code 0

```bash
npx prvc validate --mode=warn
```

**`fail`**: Exit with code 1 on errors (useful for CI)

```bash
npx prvc validate --mode=fail
```

## 🤖 AI Starter Packs

The CLI can install pre-configured AI assistant guides for:

### Cursor

Creates rules and prompts for Cursor IDE:

- `provenance/ai/cursor/rules.md` - Cursor rules
- `provenance/ai/cursor/prompts/create-decision.md`
- `provenance/ai/cursor/prompts/create-risk.md`
- `provenance/ai/cursor/prompts/pr-review.md`

### Claude Code

Creates guidelines for Claude Code assistant:

- `provenance/ai/claude/README.md`

### Antigravity

Creates integration guide for Antigravity:

- `provenance/ai/antigravity/GUIDE.md`

All starter packs:

- ✅ Instruct AI to create G2-compliant records
- ✅ Default status to "draft"
- ✅ Encourage linking PRs and issues
- ❌ Never claim to approve or enforce governance

## 🔄 Optional GitHub CI

If you enable CI with `--ci=github`, the CLI creates:

```yaml
.github/workflows/provenancecode.yml
```

**Default behavior:**

- Runs `npx prvc validate`
- Prints warnings
- Does **NOT** block merges unless you configure `--ci-mode=fail`

**The CLI does not configure branch protection.**

## ⚙️ Configuration

### `provenance.config.json`

```json
{
  "standard": "g2",
  "version": "2.0",
  "idScheme": "DEC-{APP}-{AREA}-{SEQ6}",
  "riskIdScheme": "RSK-{APP}-{AREA}-{SEQ6}",
  "defaultAppCode": "MYAPP",
  "defaultArea": "CORE",
  "paths": {
    "root": "provenance",
    "decisions": "provenance/decisions",
    "risks": "provenance/risks",
    "schemas": "provenance/schemas"
  },
  "validation": {
    "mode": "warn"
  }
}
```

## 🏗️ Architecture

**Stack:**

- Node.js
- TypeScript
- Commander (CLI framework)
- AJV (JSON schema validation)
- Chalk (terminal colors)

**Constraints:**

- ✅ No remote database
- ✅ No telemetry by default
- ✅ No SaaS calls
- ✅ < 1000 LOC target

## 🎯 Strategic Boundary

### Open Layer (CLI)

The CLI handles:

- Record creation
- Schema compliance
- AI guidance
- Local validation

### Paid Layer (GitHub App)

The GitHub App handles:

- Enforcement
- PR blocking
- Approval workflow
- Org dashboards
- Cross-repo analytics
- Escalation workflows
- Decision velocity metrics

**The CLI must remain governance-free.**

## 🔮 Future Extensions (Non-Governance)

Allowed future CLI additions:

- ✅ Mermaid diagram generation from decisions
- ✅ Markdown export
- ✅ Static decision index generation
- ✅ Decision graph visualization (local)

**Not allowed:**

- ❌ Centralized policy packs
- ❌ Enforcement presets
- ❌ Approval management
- ❌ Compliance mode

## 📚 Resources

- [ProvenanceCode Website](https://provenancecode.org)
- [ProvenanceCode v2.0 Standard](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/)
- [GitHub](https://github.com/provenancecode/prvc)

## 📖 Documentation

- **[USAGE.md](USAGE.md)** - Installation and usage guide (npx vs global vs development)
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command cheat sheet
- **[FEATURES.md](FEATURES.md)** - Detailed feature documentation
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[V2_COMPLIANCE.md](V2_COMPLIANCE.md)** - ProvenanceCode v2.0 standard compliance
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Implementation overview
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 📄 License

Apache-2.0

---

**Built with ❤️ by the ProvenanceCode team**

**Quick Start:** `npx prvc install` • [Full Documentation](USAGE.md) • [Commands](QUICK_REFERENCE.md)
