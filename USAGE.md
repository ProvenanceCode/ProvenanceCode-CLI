# How to Use ProvenanceCode CLI

## Understanding the CLI vs npm scripts

The ProvenanceCode CLI is a **binary command-line tool** (`prvc`), not npm scripts. The commands are accessed through the `prvc` executable.

## Installation Methods

### Method 1: Use with npx (Recommended - No Installation)

```bash
# Run directly without installing
npx provenancecode-cli install
npx provenancecode-cli config set --app-code=MYAPP
npx provenancecode-cli validate

# Or shorter (if published as 'prvc')
npx prvc install
npx prvc config set --app-code=MYAPP
npx prvc validate
```

### Method 2: Global Installation

```bash
# Install globally
npm install -g provenancecode-cli

# Then use anywhere
prvc install
prvc config set --app-code=MYAPP
prvc validate
```

### Method 3: Local Development (This Repository)

```bash
# Build the project
npm run build

# Option A: Use via npm scripts (development)
npm run prvc -- install
npm run prvc -- config set --app-code=MYAPP
npm run prvc:help
npm run prvc:validate

# Option B: Run directly with node
node dist/index.js install
node dist/index.js --help

# Option C: Install locally for testing
npm run local:install
prvc install
npm run local:uninstall
```

## Available Commands

Once installed or using `npx prvc`, these commands are available:

### Setup Commands
```bash
prvc install                    # Install ProvenanceCode structure
prvc init [options]            # Full initialization with AI & CI
prvc config [action]           # Configure settings
prvc starterpack add <tool>    # Install AI starter packs
```

### Daily Use Commands
```bash
prvc journal add "title"       # Quick decision capture
prvc template use <name>       # Use smart template
prvc show <id>                 # Display decision/risk
```

### Discovery Commands
```bash
prvc search <query>            # Search decisions
prvc related <id>              # Find related decisions
prvc visualize graph           # Create visualizations
```

### Quality Commands
```bash
prvc validate                  # Validate records
prvc quality                   # Show quality score
prvc impact <id>              # Analyze impact
```

### Export Commands
```bash
prvc export --format=html      # Export to HTML
prvc upgrade                   # Learn about GitHub App
```

## npm Scripts in package.json

The scripts in `package.json` are for **development**, not the CLI commands:

| Script | Purpose | Usage |
|--------|---------|-------|
| `npm run build` | Build TypeScript | Required before using |
| `npm run dev` | Watch mode | Development |
| `npm run prvc -- <args>` | Run CLI locally | Testing |
| `npm run prvc:help` | Show help | Quick reference |
| `npm run local:install` | Install globally | Local testing |

## Examples

### For End Users (Published Package)

```bash
# One-time setup
npx prvc install
npx prvc config set --app-code=MYPROJECT --area=BACKEND
npx prvc starterpack add cursor

# Daily usage
npx prvc journal add "Decided to use PostgreSQL"
npx prvc quality
npx prvc validate
```

### For Developers (This Repository)

```bash
# Build first
npm run build

# Test commands
npm run prvc -- install
npm run prvc -- config set --app-code=TEST
npm run prvc:validate

# Or install globally for testing
npm run local:install
prvc install
prvc --help
npm run local:uninstall
```

## Why "prvc" and not npm scripts?

**CLI tools** (like `git`, `docker`, `npm`) use binaries that provide:
- ✅ Consistent interface across projects
- ✅ Works in any directory
- ✅ Can be used with npx
- ✅ Standard command-line conventions

**npm scripts** are for:
- ❌ Project-specific tasks
- ❌ Build/test/deploy workflows
- ❌ Not meant for end-user commands

## The bin Configuration

In `package.json`:

```json
{
  "bin": {
    "prvc": "dist/index.js"
  }
}
```

This tells npm to create a `prvc` command that runs `dist/index.js` when the package is installed.

## Summary

✅ **Use `prvc <command>`** - The actual CLI  
✅ **Use `npx prvc <command>`** - No installation needed  
✅ **Use `npm run prvc -- <command>`** - Local development only  
❌ **Don't expect `npm run install`** - That's npm's command, not ours!

The CLI is designed to be used as `prvc`, just like you use `git`, `docker`, or `npm` themselves!

