# ProvenanceCode CLI v1.0 - Complete Feature Guide

*"Insanely great" features that developers love, while creating natural demand for the GitHub App*

## 🎯 Overview

The ProvenanceCode CLI now includes **10 powerful features** designed to make decision documentation effortless for individual developers, while naturally creating the need for team-level governance (GitHub App).

---

## 📝 Feature 1: Decision Journal

**Purpose:** Capture decisions instantly, like a developer's diary.

### Commands

```bash
# Quick add
prvc journal add "Use Postgres over MongoDB" \
  --context="Need ACID guarantees" \
  --decision="Postgres provides better data consistency"

# Search your journal
prvc journal search "database" --fuzzy

# Export journal
prvc journal export --format=markdown --output=journal.md

# List recent decisions
prvc journal list --recent=10 --status=draft
```

### Why It's Great
- **Friction-free**: Add decisions in seconds
- **Git-aware**: Optional `--auto-link` detects PR context
- **Searchable**: Full-text search with fuzzy matching
- **Personal tool**: Perfect for solo developers

### Gateway to Paid
When teams want to share journals → they need the GitHub App

---

## 📊 Feature 2: Beautiful Visualizations

**Purpose:** Make decisions visual and shareable.

### Commands

```bash
# Interactive decision graph
prvc visualize graph --output=decision-map.html

# Mermaid diagram
prvc visualize graph --format=mermaid --output=diagram.mmd

# Timeline view
prvc visualize timeline --range=30d

# Statistics dashboard
prvc visualize stats
```

### Output
- **Graph**: Interactive D3.js network visualization
- **Timeline**: Chronological decision history  
- **Stats**: Beautiful ASCII charts and metrics

### Why It's Great
- **Gorgeous**: Production-ready HTML visualizations
- **Share-worthy**: Perfect for README or docs
- **Local-only**: No external dependencies

### Gateway to Paid
Teams wanting real-time, multi-repo dashboards → GitHub App

---

## 📋 Feature 3: Smart Templates

**Purpose:** Opinionated excellence - the "right way" to document.

### Commands

```bash
# List templates
prvc template list

# Use a template
prvc template use architecture --title="Microservices migration"
prvc template use security --title="OAuth2 implementation"
prvc template use tech-debt --title="Defer database migration"
```

### Available Templates
1. **Architecture** - For system design decisions
2. **Security** - Security and compliance decisions
3. **Tech Debt** - Intentional shortcuts
4. **API Design** - API and interface decisions
5. **Database** - Data model and schema decisions
6. **Tooling** - Developer tools and infrastructure
7. **Performance** - Optimization decisions

### Why It's Great
- **Opinionated**: Tells devs the right way
- **Zero thought**: Pre-filled with best practices
- **Consistent**: Team naturally aligns on format

### Gateway to Paid
Teams wanting custom templates and enforcement → GitHub App

---

## 🔍 Feature 4: Search & Discovery

**Purpose:** Make decisions actually useful, not forgotten.

### Commands

```bash
# Search everything
prvc search "authentication" --fuzzy

# Find related decisions
prvc related DEC-APP-CORE-000001

# Show detailed view
prvc show DEC-APP-CORE-000001
```

### Features
- **Fuzzy matching**: Find approximate matches
- **Cross-linking**: Discover related decisions
- **Beautiful output**: Formatted, colored display

### Why It's Great
- **Fast**: Instant local search
- **Smart**: Finds relationships automatically
- **Useful**: Makes historical decisions accessible

### Gateway to Paid
Teams needing cross-repo search → GitHub App

---

## 📤 Feature 5: Export Anywhere

**Purpose:** No lock-in. Own your data.

### Commands

```bash
# Export to HTML
prvc export --format=html --theme=dark

# Export to Markdown
prvc export --format=markdown --output=decisions.md

# Export to Confluence
prvc export --format=confluence

# Export to Notion
prvc export --format=notion

# Export to JSON
prvc export --format=json

# PDF (via HTML)
prvc export --format=pdf
```

### Supported Formats
- ✅ HTML (light/dark themes)
- ✅ Markdown
- ✅ Confluence markup
- ✅ Notion-compatible markdown
- ✅ JSON
- ✅ CSV (via journal export)
- ✅ PDF (via wkhtmltopdf)

### Why It's Great
- **No lock-in**: Export anytime
- **Beautiful**: Production-ready styling
- **Flexible**: Use anywhere

### Gateway to Paid
Teams wanting real-time sync to tools → GitHub App integrations

---

## 🎯 Feature 6: Impact Analysis

**Purpose:** Understand blast radius of decisions.

### Commands

```bash
# Analyze impact
prvc impact DEC-APP-CORE-000001
```

### Shows
- Linked decisions (upstream/downstream)
- Related risks
- Dependent decisions
- Impact score (LOW/MEDIUM/HIGH)

### Why It's Great
- **Risk awareness**: Know what's affected
- **Local analysis**: Fast, no external calls
- **Visual scoring**: Clear impact levels

### Gateway to Paid
Teams needing org-wide impact analysis → GitHub App

---

## 📈 Feature 7: Quality Scoring

**Purpose:** Gamify good documentation.

### Commands

```bash
# Show quality score
prvc quality
```

### Metrics
- Overall score (0-10)
- Documentation completeness %
- Status distribution
- Risk tracking
- Personalized recommendations

### Example Output
```
📊 Decision Quality Score

Overall Score: 8.2/10
████████████████████████████████░░░░░░░░

Documentation Completeness:
  With Consequences: 15/18 ████████████████░░ 83%
  With Risk Assessment: 14/18 ███████████████░ 78%
  With Links: 12/18 █████████████░░░ 67%

💡 Recommendations:
  • Add consequences to 3 more decisions
  • Link decisions to PRs and issues
```

### Why It's Great
- **Motivating**: Developers love scores
- **Actionable**: Clear recommendations
- **Personal**: Individual improvement

### Gateway to Paid
Teams wanting team scores and benchmarking → GitHub App

---

## 📚 Feature 8 & 9: Templates + Context Awareness

**Already covered above in Smart Templates**

The auto-link feature provides git context awareness when adding decisions.

---

## 🚀 Feature 10: Upgrade Info

**Purpose:** The (only) upsell moment.

### Command

```bash
prvc upgrade
```

### Shows
- What the CLI does (free forever)
- What the GitHub App adds (team features)
- One-time message (never nags)

### Why It's Great
- **Respectful**: Shows once, never nags
- **Clear**: Explains the boundary
- **Helpful**: When teams hit limits, they know where to go

---

## 🎨 Design Philosophy

### What Makes These Features "Insanely Great"

1. **Beautiful Output**
   - Colored, formatted terminal output
   - Production-ready HTML exports
   - Interactive visualizations

2. **Zero Friction**
   - Commands are intuitive
   - Defaults are sensible
   - No configuration needed

3. **Local-First**
   - No SaaS calls
   - No telemetry
   - Fast and private

4. **Strategic Boundary**
   - CLI = Individual productivity
   - GitHub App = Team governance
   - Natural upgrade path

---

## 📊 Feature Comparison Matrix

| Feature | CLI (Free) | GitHub App (Paid) |
|---------|-----------|-------------------|
| **Decision capture** | ✅ Personal journal | ✅ Team workflows |
| **Visualization** | ✅ Local HTML | ✅ Real-time dashboards |
| **Templates** | ✅ Built-in 7 | ✅ Custom + enforcement |
| **Search** | ✅ Local repo | ✅ Cross-repo + org-wide |
| **Export** | ✅ All formats | ✅ Auto-sync integrations |
| **Quality scoring** | ✅ Individual | ✅ Team + benchmarks |
| **Impact analysis** | ✅ Single repo | ✅ Cross-repo dependencies |
| **Approval workflows** | ❌ | ✅ Multi-party approval |
| **PR blocking** | ❌ | ✅ Enforce before merge |
| **Compliance** | ❌ | ✅ SOC2, ISO27001 reports |
| **Team dashboards** | ❌ | ✅ Real-time metrics |
| **Slack/Teams** | ❌ | ✅ Notifications |

---

## 🚦 The Upsell Triggers

### When Developers Hit These Moments:

1. **"Can you send me that graph?"**
   → Need shared dashboards

2. **"We should all use the same template"**
   → Need template enforcement

3. **"Did anyone review this decision?"**
   → Need approval workflows

4. **"What decisions were made in other repos?"**
   → Need cross-repo search

5. **"We need this for our SOC2 audit"**
   → Need compliance features

6. **"Can we block PRs without decisions?"**
   → Need enforcement

**That's when they upgrade to the GitHub App.**

---

## 🎯 Success Metrics

### For CLI Adoption
- Time to first decision: < 60 seconds
- Daily active usage rate
- Average decisions per week
- Quality score trend

### For GitHub App Conversion
- Team size (3+ devs = conversion opportunity)
- Feature request patterns
- Export frequency (sharing intent)
- Quality score plateau (hit individual limits)

---

## 💡 Future CLI Extensions (Allowed)

These would NOT cannibalize the GitHub App:

- ✅ Decision dependency graphs (local)
- ✅ More export formats
- ✅ Decision changelog/history
- ✅ Offline search index
- ✅ More templates
- ✅ Custom themes for exports

These are FORBIDDEN (reserved for GitHub App):

- ❌ Remote storage/sync
- ❌ Team features
- ❌ Approval workflows
- ❌ Policy enforcement
- ❌ Cross-repo analytics
- ❌ Integrations (Slack, Teams, etc.)

---

**Built with ❤️ by the ProvenanceCode team**

*Making decision documentation so good, developers actually use it.*


