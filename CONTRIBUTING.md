# Contributing to ProvenanceCode CLI

Thank you for your interest in contributing to the ProvenanceCode CLI!

## 🎯 Project Principles

Before contributing, please understand our core principles:

### What the CLI Should Do

✅ Enable developers to adopt ProvenanceCode G2
✅ Validate record structure and schema compliance
✅ Generate templates and starter packs
✅ Provide helpful local tooling

### What the CLI Should NOT Do

❌ Enforce governance workflows
❌ Block PR merges based on approval state
❌ Manage organizational policy
❌ Track metrics or analytics
❌ Make SaaS calls or phone home

**The CLI is the open layer. The GitHub App is the governance layer.**

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/provenancecode/prvc.git
cd prvc

# Install dependencies
npm install

# Build the project
npm run build

# Test locally
node dist/index.js --help
```

## 🏗️ Project Structure

```
src/
  commands/          # Command implementations
    init.ts         # Initialize command
    validate.ts     # Validation command
  schemas/          # G2 JSON schemas
  index.ts          # CLI entry point
  types.ts          # TypeScript types
  utils.ts          # Utility functions
  validator.ts      # Validation logic
  templates.ts      # Template generators
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

### Testing

Before submitting a PR:

```bash
# Build the project
npm run build

# Test commands manually
node dist/index.js init --app-code=TEST
node dist/index.js validate
```

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable
- Keep commits focused on single changes

## 🐛 Reporting Bugs

Please open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version)
- CLI version

## 💡 Feature Requests

Before requesting a feature, ask:

1. **Is this governance-related?** → Should be in GitHub App
2. **Does it require SaaS?** → Not suitable for CLI
3. **Is it local tooling?** → Great for CLI!

Allowed feature categories:

- ✅ Local validation improvements
- ✅ Template generation
- ✅ Documentation exports
- ✅ Visualization (local only)
- ✅ AI assistant improvements

Not allowed:

- ❌ Enforcement logic
- ❌ Approval workflows
- ❌ Policy management
- ❌ Centralized analytics

## 🔍 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Build and test (`npm run build`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### PR Guidelines

- Describe what your PR does
- Reference related issues
- Include examples if applicable
- Ensure builds successfully
- Keep PRs focused and atomic

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect the project's strategic boundaries

## ❓ Questions?

Open an issue or discussion on GitHub!

---

Thank you for contributing to ProvenanceCode! 🙌

