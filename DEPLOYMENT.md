# Deployment Checklist

## Pre-Publication Checks

### ✅ Code Quality
- [x] TypeScript compiles without errors
- [x] No linter errors
- [x] All commands tested and working
- [x] Schema validation working correctly
- [x] Template files excluded from validation
- [x] ID format validation working

### ✅ Documentation
- [x] README.md complete
- [x] QUICKSTART.md created
- [x] CONTRIBUTING.md with strategic boundaries
- [x] CHANGELOG.md with v2.0.0 entry
- [x] LICENSE file (MIT)
- [x] Examples provided
- [x] PROJECT_SUMMARY.md

### ✅ Package Configuration
- [x] package.json configured correctly
- [x] bin entry points to dist/index.js
- [x] Dependencies listed
- [x] Version set to 2.0.0
- [x] .npmignore configured
- [x] .gitignore configured

### ✅ Build System
- [x] TypeScript compilation working
- [x] Schema files copied to dist/
- [x] Build script includes all necessary steps
- [x] dist/ folder structure correct

### ✅ Features Tested
- [x] `prvc init` - basic
- [x] `prvc init --ai=cursor,claude,antigravity`
- [x] `prvc init --ci=github`
- [x] `prvc validate` - warn mode
- [x] `prvc validate --mode=fail`
- [x] `prvc starter add <tool>`
- [x] All AI starter packs generate correctly
- [x] GitHub CI workflow generates correctly
- [x] Valid records pass validation
- [x] Invalid records show proper errors

## NPM Publication Steps

### 1. Verify Package

```bash
# Build
npm run build

# Test installation locally
npm pack
npm install -g prvc-2.0.0.tgz

# Test commands
prvc --version
prvc --help
```

### 2. Update Version (if needed)

```bash
# For patches
npm version patch

# For minor versions
npm version minor

# For major versions
npm version major
```

### 3. Login to NPM

```bash
npm login
# Enter credentials
```

### 4. Publish

```bash
# Dry run first
npm publish --dry-run

# Actual publish
npm publish

# Or with scope
npm publish --access public
```

### 5. Verify Publication

```bash
# Install from NPM
npx prvc@latest --version

# Test in fresh directory
cd /tmp/test-install
npx prvc init
```

## GitHub Repository Setup

### 1. Create Repository

```bash
# On GitHub, create repo: provenancecode/prvc
```

### 2. Initialize and Push

```bash
cd ProvenanceCode-CLI

# Initialize if not already
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: Initial release v2.0.0

- Implement G2 standard
- Add init, validate, and starter commands
- Include AI starter packs for Cursor, Claude, Antigravity
- Optional GitHub CI workflow generation
- Comprehensive documentation and examples"

# Add remote
git remote add origin https://github.com/provenancecode/prvc.git

# Push
git branch -M main
git push -u origin main
```

### 3. Create Release

```bash
# Tag the release
git tag -a v2.0.0 -m "Release v2.0.0

ProvenanceCode CLI (prvc) - Initial Release

Features:
- G2 (v2.0) standard implementation
- Init command for bootstrapping
- Validation with warn/fail modes
- AI starter packs (Cursor, Claude, Antigravity)
- Optional GitHub CI integration
- Comprehensive documentation

See CHANGELOG.md for full details."

# Push tag
git push origin v2.0.0
```

### 4. Create GitHub Release

On GitHub:
1. Go to Releases
2. Click "Create a new release"
3. Select tag v2.0.0
4. Title: "ProvenanceCode CLI v2.0.0"
5. Copy release notes from CHANGELOG.md
6. Attach build artifacts (optional)
7. Publish release

## Post-Publication

### 1. Verify NPM Package

- [ ] Check package page on npmjs.com
- [ ] Verify README displays correctly
- [ ] Test installation: `npx prvc@latest --version`
- [ ] Test in fresh project

### 2. Update Documentation Site

- [ ] Update provenancecode.org with CLI documentation
- [ ] Add CLI to navigation
- [ ] Create examples page
- [ ] Add installation instructions

### 3. Announce

- [ ] Twitter/X announcement
- [ ] Dev.to article
- [ ] Hacker News (if appropriate)
- [ ] Reddit r/programming (if appropriate)
- [ ] Internal team notification

### 4. Monitor

- [ ] Watch for GitHub issues
- [ ] Monitor NPM downloads
- [ ] Check for security vulnerabilities
- [ ] Review user feedback

## Future Enhancements Backlog

### Allowed (Non-Governance)

- [ ] Mermaid diagram generation
- [ ] Markdown export functionality
- [ ] Static decision index HTML generation
- [ ] Decision graph visualization (local)
- [ ] Search/filter commands
- [ ] Statistics command (local only)
- [ ] Export to various formats (PDF, HTML)

### Not Allowed (Reserved for GitHub App)

- ❌ Enforcement logic
- ❌ Approval workflows
- ❌ Policy management
- ❌ Centralized analytics
- ❌ PR blocking based on approval
- ❌ Multi-party validation

## Maintenance Schedule

### Weekly
- [ ] Check for security vulnerabilities
- [ ] Review and respond to issues
- [ ] Monitor NPM downloads

### Monthly
- [ ] Update dependencies
- [ ] Review and merge PRs
- [ ] Update documentation if needed

### Quarterly
- [ ] Review roadmap
- [ ] Plan new features (non-governance only)
- [ ] Update examples

## Support Channels

- GitHub Issues: Bug reports, feature requests
- GitHub Discussions: Questions, ideas
- Email: support@provenancecode.org (if available)
- Discord/Slack: Community support (if available)

---

## Quick Commands Reference

```bash
# Build
npm run build

# Test locally
node dist/index.js --help

# Pack for testing
npm pack

# Publish
npm publish

# Create tag
git tag v2.0.0
git push origin v2.0.0
```

---

**Ready to deploy! 🚀**


