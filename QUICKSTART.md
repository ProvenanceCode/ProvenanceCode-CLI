# ProvenanceCode CLI - Quick Start Guide

Get started with ProvenanceCode in 5 minutes!

## Installation

No installation needed! Use `npx`:

```bash
npx prvc init
```

Or install globally:

```bash
npm install -g prvc
```

## Step 1: Initialize Your Repository

```bash
cd your-project
npx prvc init --app-code=MYAPP --area=CORE
```

This creates:

```
provenance/
├── decisions/         # Decision records go here
├── risks/            # Risk records go here
├── schemas/          # JSON schemas for validation
├── provenance.config.json
└── README.md
```

## Step 2: Create Your First Decision

Copy and edit the template:

```bash
cd your-project
cp provenance/decisions/TEMPLATE.json provenance/decisions/DEC-MYAPP-CORE-000001.json
```

Edit the file:

```json
{
  "schema": "https://provenancecode.org/schemas/decision.g2.schema.json",
  "decision_id": "DEC-MYAPP-CORE-000001",
  "title": "Use React for frontend",
  "status": "draft",
  "context": "Need to choose frontend framework...",
  "decision": "We will use React...",
  "consequences": "Pros and cons...",
  "risk": "Risk assessment...",
  "links": []
}
```

## Step 3: Validate

```bash
npx prvc validate
```

Output:

```
🔍 Validating ProvenanceCode records...
Validated 1 decision(s) and 0 risk(s)
✨ All records are valid!
```

## Step 4: Add AI Assistant (Optional)

Make your AI coding assistant ProvenanceCode-aware:

```bash
npx prvc starter add cursor
```

This creates AI-specific rules and prompts in `provenance/ai/cursor/`.

Supported AI tools:
- `cursor` - Cursor IDE
- `claude` - Claude Code
- `antigravity` - Antigravity

## Step 5: Add CI Validation (Optional)

Add GitHub Actions workflow:

```bash
npx prvc init --ci=github --ci-mode=warn
```

Or for strict validation:

```bash
npx prvc init --ci=github --ci-mode=fail
```

Creates `.github/workflows/provenancecode.yml` that validates on PR.

## Common Commands

### Initialize with options

```bash
# Full featured setup
npx prvc init \
  --app-code=MYAPP \
  --area=BACKEND \
  --ai=cursor,claude \
  --ci=github \
  --ci-mode=warn
```

### Validate records

```bash
# Default mode (warn)
npx prvc validate

# Strict mode (fail on errors)
npx prvc validate --mode=fail
```

### Add AI starter pack

```bash
npx prvc starter add cursor
npx prvc starter add claude
npx prvc starter add antigravity
```

## ID Format

ProvenanceCode uses structured IDs:

**Decisions**: `DEC-{APP}-{AREA}-{000001}`
- Example: `DEC-MYAPP-CORE-000001`

**Risks**: `RSK-{APP}-{AREA}-{000001}`
- Example: `RSK-MYAPP-SECURITY-000001`

The CLI auto-increments the sequence number.

## Decision Statuses

Valid status values:
- `draft` - Initial creation (recommended default)
- `proposed` - Ready for review
- `accepted` - Approved and active
- `rejected` - Not approved
- `deprecated` - No longer relevant
- `superseded` - Replaced by another decision

## Risk Severity Levels

- `low` - Minor impact
- `medium` - Moderate impact
- `high` - Significant impact
- `critical` - Severe impact

## Risk Statuses

- `open` - Identified but not addressed
- `monitoring` - Being tracked
- `mitigated` - Mitigation in place
- `accepted` - Accepted as-is
- `closed` - Resolved

## Linking Records

Link decisions to PRs, issues, and other decisions:

```json
{
  "links": [
    {
      "type": "pr",
      "url": "https://github.com/org/repo/pull/123",
      "title": "Implementation PR"
    },
    {
      "type": "decision",
      "url": "DEC-MYAPP-CORE-000002",
      "title": "Related decision"
    }
  ]
}
```

Link risks to decisions:

```json
{
  "risk_id": "RSK-MYAPP-CORE-000001",
  "linked_decisions": ["DEC-MYAPP-CORE-000001"]
}
```

## Best Practices

1. **Keep decisions atomic** - One decision per file
2. **Link to PRs** - Always link implementation PRs
3. **Document consequences** - Both positive and negative
4. **Assess risks** - Link to risk records
5. **Start with draft** - Use `"status": "draft"` for new records
6. **Use meaningful IDs** - Choose descriptive APP and AREA codes

## Troubleshooting

### "ProvenanceCode is not initialized"

Run `npx prvc init` first.

### Validation errors

Check:
1. ID format matches pattern
2. All required fields present
3. Status is valid enum value
4. Schema URL is correct

### Schema not found

Rebuild the CLI:
```bash
npm run build
```

## Next Steps

- Read the [full README](../README.md)
- Check out [examples](../examples/)
- Visit [ProvenanceCode.org](https://provenancecode.org)
- Consider the [GitHub App](https://provenancecode.org/app) for governance

---

**Need help?** Open an issue on GitHub!

