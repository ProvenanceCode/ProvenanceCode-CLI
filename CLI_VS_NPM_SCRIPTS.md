# Understanding npm Scripts vs CLI Commands

## The Confusion

When you looked at `package.json` and said "I don't see these commands", you were expecting to see `prvc install`, `prvc config`, etc. as npm scripts.

## The Clarification

**ProvenanceCode CLI is a binary tool, not npm scripts.**

### What This Means

```json
// package.json
{
  "bin": {
    "prvc": "dist/index.js"
  }
}
```

This configuration tells npm to create a **binary executable** called `prvc` that runs `dist/index.js`.

### How Users Access Commands

#### End Users (Recommended)
```bash
# No installation needed
npx prvc install
npx prvc config set --app-code=MYAPP
npx prvc validate

# Or install globally once
npm install -g provenancecode-cli
prvc install
prvc validate
```

#### Developers (Working on the CLI)
```bash
# Build first
npm run build

# Then use npm scripts to test
npm run prvc -- install
npm run prvc:help
npm run prvc:validate
```

## Why Not npm Scripts?

### CLI Binary Approach ✅
- Works anywhere: `npx prvc install`
- Consistent interface like `git`, `docker`, `npm`
- Can be used globally
- Standard command-line conventions
- Discoverable with `--help`

### npm Scripts Approach ❌
- Would be: `npm run prvc:install`
- Only works in project root
- Not standard CLI convention
- Confusing for users
- Doesn't work with `npx`

## What ARE the npm Scripts For?

The scripts in `package.json` are for **development of the CLI itself**:

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm run build` | Compile TypeScript | Before testing |
| `npm run dev` | Watch mode | While coding |
| `npm run prvc -- <args>` | Test CLI locally | Development |
| `npm run prvc:help` | Quick help | Testing |
| `npm run local:install` | Install globally | Local testing |
| `npm run local:uninstall` | Remove global | Clean up |

## Examples of Other CLIs

All these work the same way:

```bash
# These are binaries, not npm scripts:
npx create-react-app my-app
npx typescript --init
npx eslint --init
git commit -m "message"
docker run image
npm install package

# You don't do:
npm run git:commit
npm run docker:run
npm run npm:install
```

## The New Scripts We Added

We added **convenience scripts for development**:

```json
{
  "scripts": {
    "prvc": "node dist/index.js",
    "prvc:help": "npm run prvc -- --help",
    "prvc:install": "npm run prvc -- install",
    "prvc:config": "npm run prvc -- config list",
    "prvc:validate": "npm run prvc -- validate",
    "prvc:quality": "npm run prvc -- quality",
    "local:install": "npm install -g .",
    "local:uninstall": "npm uninstall -g provenancecode-cli"
  }
}
```

These are **only for developers working on the CLI**, not end users.

## Summary

✅ **For End Users:**
```bash
npx prvc install
npx prvc config set --app-code=MYAPP
```

✅ **For CLI Developers:**
```bash
npm run build
npm run prvc:help
npm run local:install
```

❌ **NOT This:**
```bash
npm run install  # This is npm's command!
npm run config   # Not how it works
```

## References

- **[USAGE.md](USAGE.md)** - Complete installation and usage guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - All commands at a glance
- **[README.md](README.md)** - Main documentation

---

**The TL;DR:** `prvc` is a **CLI tool** (like `git`), accessed via `npx prvc` or global install, not npm scripts. The scripts in `package.json` are for **building and testing the CLI**, not using it.


