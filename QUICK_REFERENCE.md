# ProvenanceCode CLI - Quick Reference

## 🚀 Installation & Usage

```bash
# Use without installing (recommended)
npx prvc <command>

# Or install globally
npm install -g provenancecode-cli
prvc <command>

# Local development
npm run build
npm run prvc -- <command>
```

## 📋 All Commands

### Setup (One-time)
| Command | Description | Example |
|---------|-------------|---------|
| `prvc install` | Install structure | `npx prvc install` |
| `prvc config set` | Configure project | `npx prvc config set --app-code=SHOP --area=FE` |
| `prvc starterpack add` | Add AI pack | `npx prvc starterpack add cursor` |

### Configuration
| Command | Description | Example |
|---------|-------------|---------|
| `prvc config list` | Show config | `npx prvc config list` |
| `prvc config set` | Update config | `npx prvc config set --app-code=MYAPP` |
| `prvc config monorepo` | Monorepo setup | `npx prvc config monorepo --roots="apps/web,apps/api"` |

### Daily Use
| Command | Description | Example |
|---------|-------------|---------|
| `prvc journal add` | Quick decision | `npx prvc journal add "Use Redis"` |
| `prvc template use` | From template | `npx prvc template use architecture` |
| `prvc show` | Display record | `npx prvc show DEC-SHOP-FE-000001` |

### Discovery
| Command | Description | Example |
|---------|-------------|---------|
| `prvc search` | Search records | `npx prvc search "database"` |
| `prvc related` | Find related | `npx prvc related DEC-SHOP-FE-000001` |
| `prvc visualize` | Create viz | `npx prvc visualize graph` |

### Quality
| Command | Description | Example |
|---------|-------------|---------|
| `prvc validate` | Check validity | `npx prvc validate` |
| `prvc quality` | Show score | `npx prvc quality` |
| `prvc impact` | Analyze impact | `npx prvc impact DEC-SHOP-FE-000001` |

### Export
| Command | Description | Example |
|---------|-------------|---------|
| `prvc export` | Export records | `npx prvc export --format=html` |

## 🎯 Common Workflows

### New Project Setup
```bash
npx prvc install
npx prvc config set --app-code=MYPROJECT --area=CORE
npx prvc starterpack add cursor
npx prvc journal add "First decision"
```

### Monorepo Setup
```bash
npx prvc install
npx prvc config set --app-code=MONO
npx prvc config monorepo --roots="apps/web,apps/api,packages/shared"
npx prvc starterpack add cursor
```

### Daily Documentation
```bash
npx prvc journal add "Decided to use PostgreSQL"
npx prvc quality
npx prvc validate
```

### Create from Template
```bash
npx prvc template list
npx prvc template use architecture --title="Microservices migration"
```

### Search & Explore
```bash
npx prvc search "authentication"
npx prvc show DEC-SHOP-FE-000001
npx prvc related DEC-SHOP-FE-000001
npx prvc impact DEC-SHOP-FE-000001
```

### Visualization & Export
```bash
npx prvc visualize graph --output=decisions.html
npx prvc visualize stats
npx prvc export --format=html --theme=dark
```

## 💡 npm Scripts (Development Only)

These are for working **on** the CLI, not **using** it:

```bash
npm run build          # Build TypeScript
npm run dev            # Watch mode
npm run prvc -- help   # Test locally
npm run prvc:help      # Quick help
npm run local:install  # Install globally for testing
```

## 📚 Help

```bash
prvc --help                    # All commands
prvc <command> --help          # Command-specific help
```

## 🔗 Links

- **Docs**: See README.md
- **Standard**: https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/
- **Issues**: https://github.com/provenancecode/prvc/issues

---

**Remember:** Use `npx prvc <command>` or install globally with `npm install -g provenancecode-cli`

