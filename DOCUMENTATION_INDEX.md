# ProvenanceCode CLI - Complete Documentation Index

## 🎯 Quick Navigation

**New to ProvenanceCode?** Start here:
1. [QUICKSTART.md](QUICKSTART.md) - Get running in 5 minutes
2. [USAGE.md](USAGE.md) - Understand how to use the CLI
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet

**Understanding the CLI:**
- [CLI_VS_NPM_SCRIPTS.md](CLI_VS_NPM_SCRIPTS.md) - Why commands aren't in package.json

**Feature Deep Dives:**
- [FEATURES.md](FEATURES.md) - All 10+ features explained
- [V2_COMPLIANCE.md](V2_COMPLIANCE.md) - ProvenanceCode v2.0 standard

**For Contributors:**
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Architecture overview
- [CHANGELOG.md](CHANGELOG.md) - Version history

## 📖 Main Documentation

### [README.md](README.md)
The main entry point. Covers:
- What ProvenanceCode CLI does (and doesn't do)
- Installation options
- Core commands overview
- New features highlight
- Examples and use cases

### [USAGE.md](USAGE.md) ⭐ READ THIS IF CONFUSED
**Critical document** explaining:
- How CLI binaries work (vs npm scripts)
- Three ways to use the CLI:
  1. `npx prvc <command>` (recommended)
  2. Global install: `npm install -g provenancecode-cli`
  3. Local development: `npm run prvc -- <command>`
- Why commands aren't npm scripts
- Development vs end-user workflows

### [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
One-page command reference:
- All commands in tables
- Common workflows
- Examples for every use case
- Quick copy-paste snippets

### [CLI_VS_NPM_SCRIPTS.md](CLI_VS_NPM_SCRIPTS.md)
Explains the confusion:
- Why `prvc` is a binary, not npm scripts
- How the `bin` field in package.json works
- What the npm scripts ARE for (development)
- Examples from other CLIs (git, docker, etc.)

## 🚀 Getting Started Guides

### [QUICKSTART.md](QUICKSTART.md)
Zero to ProvenanceCode in 5 minutes:
- Simple install
- First decision
- Basic workflows
- Next steps

## 🔧 Technical Documentation

### [FEATURES.md](FEATURES.md)
Deep dive into all features:
1. Decision Journal
2. Local Visualizations
3. Smart Templates
4. Context Awareness
5. Search & Discovery
6. Export Formats
7. Decision Diff
8. Impact Analysis
9. Quality Scoring
10. Upgrade Info
11. Install Command
12. Config Command
13. Starter Packs

Each with:
- Commands
- Options
- Examples
- Use cases

### [V2_COMPLIANCE.md](V2_COMPLIANCE.md)
ProvenanceCode v2.0 standard implementation:
- Schema updates
- ID format changes
- New registry files (codes.json, sequences.json)
- Project/subproject structure
- Migration guide
- Validation rules

### [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
Architecture and implementation:
- Project structure
- Technology stack
- Command architecture
- Development workflow
- Build process

## 👥 Contributing

### [CONTRIBUTING.md](CONTRIBUTING.md)
How to contribute:
- Development setup
- Coding standards
- Commit guidelines
- Pull request process
- Testing requirements

### [CHANGELOG.md](CHANGELOG.md)
Version history and changes:
- What's new in each version
- Breaking changes
- Bug fixes
- Migration notes

## 🎓 Use Case Documentation

### Monorepo Projects
See: [FEATURES.md#config-command](FEATURES.md) and [USAGE.md](USAGE.md)
```bash
npx prvc config monorepo --roots="apps/web,apps/api"
```

### AI IDE Integration
See: [FEATURES.md#starter-packs](FEATURES.md)
```bash
npx prvc starterpack add cursor
npx prvc starterpack add claude
```

### Team Documentation
See: [FEATURES.md#export-formats](FEATURES.md)
```bash
npx prvc export --format=html --theme=dark
npx prvc visualize graph
```

### Quality & Governance
See: [FEATURES.md#quality-scoring](FEATURES.md)
```bash
npx prvc quality
npx prvc impact DEC-MYAPP-CORE-000001
```

## 📚 External Resources

- **ProvenanceCode Website:** https://provenancecode.org
- **v2.0 Standard:** https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/
- **GitHub Repository:** https://github.com/provenancecode/prvc
- **Issue Tracker:** https://github.com/provenancecode/prvc/issues

## 🆘 Common Questions

### "I don't see the commands in package.json"
→ Read [CLI_VS_NPM_SCRIPTS.md](CLI_VS_NPM_SCRIPTS.md) and [USAGE.md](USAGE.md)

The commands are accessed via the `prvc` binary, not npm scripts.
Use: `npx prvc <command>` or install globally.

### "How do I install this?"
→ Read [USAGE.md#installation-methods](USAGE.md)

Three options:
1. `npx prvc <command>` (no install)
2. `npm install -g provenancecode-cli` (global)
3. Clone + `npm run build` (development)

### "What's the difference between install and init?"
→ Read [FEATURES.md](FEATURES.md)

- `install`: Quick structure only
- `init`: Full setup with AI + CI

### "How do I use this in a monorepo?"
→ Read [FEATURES.md#config-command](FEATURES.md)

```bash
npx prvc install
npx prvc config monorepo --roots="pkg1,pkg2"
```

### "What's new in v2.0?"
→ Read [V2_COMPLIANCE.md](V2_COMPLIANCE.md)

- New ID format
- Project/subproject structure
- Registry files (codes.json, sequences.json)
- Enhanced metadata

### "How do I contribute?"
→ Read [CONTRIBUTING.md](CONTRIBUTING.md)

1. Fork the repo
2. Create a branch
3. Make changes
4. Submit PR

## 📋 Document Quick Access

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [README.md](README.md) | Overview | First time |
| [USAGE.md](USAGE.md) | How to use | Confused about installation |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command list | Daily reference |
| [CLI_VS_NPM_SCRIPTS.md](CLI_VS_NPM_SCRIPTS.md) | Binary vs scripts | Confused about package.json |
| [QUICKSTART.md](QUICKSTART.md) | Get started fast | Want to try it now |
| [FEATURES.md](FEATURES.md) | Feature details | Learning capabilities |
| [V2_COMPLIANCE.md](V2_COMPLIANCE.md) | v2.0 standard | Technical details |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Architecture | Contributing |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide | Want to contribute |
| [CHANGELOG.md](CHANGELOG.md) | Version history | Upgrading |

## 🎯 Workflows by Role

### End User (Developer)
1. [QUICKSTART.md](QUICKSTART.md) - Get started
2. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Daily commands
3. [FEATURES.md](FEATURES.md) - Learn features

### CLI Developer
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Architecture
2. [CONTRIBUTING.md](CONTRIBUTING.md) - Standards
3. [USAGE.md](USAGE.md) - Testing locally

### Team Lead
1. [README.md](README.md) - Overview
2. [FEATURES.md](FEATURES.md) - Capabilities
3. [V2_COMPLIANCE.md](V2_COMPLIANCE.md) - Standards compliance

### Open Source Contributor
1. [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Codebase tour
3. [CHANGELOG.md](CHANGELOG.md) - Recent changes

---

## Quick Start for Different Users

### "I want to use ProvenanceCode now"
```bash
npx prvc install
npx prvc config set --app-code=MYAPP
npx prvc journal add "First decision"
```
→ Read: [QUICKSTART.md](QUICKSTART.md)

### "I want to understand what this is"
→ Read: [README.md](README.md) → [FEATURES.md](FEATURES.md)

### "I'm confused about npm scripts"
→ Read: [CLI_VS_NPM_SCRIPTS.md](CLI_VS_NPM_SCRIPTS.md) → [USAGE.md](USAGE.md)

### "I want to contribute"
→ Read: [CONTRIBUTING.md](CONTRIBUTING.md) → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

### "I need a command reference"
→ Read: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**The ProvenanceCode CLI is a complete solution for decision documentation. Start with [QUICKSTART.md](QUICKSTART.md) and explore from there!**

