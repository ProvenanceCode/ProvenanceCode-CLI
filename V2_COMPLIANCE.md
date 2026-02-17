# ProvenanceCode CLI - v2.0 Standard Compliance ✅

## Overview

The ProvenanceCode CLI is now fully compliant with the [official ProvenanceCode v2.0 standard](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/).

## ✅ Compliance Checklist

### Schema Identifiers
- ✅ **Decision schema**: `provenancecode.decision.v2` (was: `https://provenancecode.org/schemas/decision.g2.schema.json`)
- ✅ **Risk schema**: `provenancecode.risk.v2` (was: `https://provenancecode.org/schemas/risk.g2.schema.json`)
- ✅ Backward compatible with old schema URLs

### ID Format
- ✅ **Decision IDs**: `DEC-{PROJECT}-{SUBPROJECT}-{SEQ6}`
  - Example: `DEC-SHOP-FE-000001`
  - Pattern: `^DEC-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$`
- ✅ **Risk IDs**: `RA-{PROJECT}-{SUBPROJECT}-{SEQ6}` (uses RA prefix per standard)
  - Example: `RA-SHOP-SEC-000001`
  - Pattern: `^RA-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$`
- ✅ **Project code**: 2-4 uppercase characters (A-Z, 0-9)
- ✅ **Subproject code**: 2-4 uppercase characters (A-Z, 0-9)

### Configuration Files

#### codes.json ✅
Standard registry file created at `provenance/codes.json`:

```json
{
  "schema": "provenancecode.codes@1.0",
  "version": "1.0",
  "monorepo": false,
  "projects": {
    "SHOP": {
      "name": "SHOP",
      "subprojects": {
        "FE": {
          "name": "FE",
          "workspace": "."
        }
      }
    }
  }
}
```

**Features:**
- Auto-created on `prvc install`
- Auto-updated when setting project/subproject via `prvc config`
- Supports monorepo configuration
- Validates project/subproject code format (2-4 chars)

#### sequences.json ✅
Standard tracking file created at `provenance/sequences.json`:

```json
{
  "schema": "provenancecode.sequences@1.0",
  "version": "1.0",
  "sequences": {}
}
```

**Features:**
- Auto-created on `prvc install`
- Tracks sequence numbers per PROJECT-SUBPROJECT-ARTIFACT_TYPE
- Prevents ID conflicts

### Schema Fields

#### Decision Schema (v2.0) ✅

**New v2.0 fields added:**

```json
{
  "schema": "provenancecode.decision.v2",
  "decision_id": "DEC-SHOP-FE-000001",
  
  "project": {
    "code": "SHOP",
    "name": "Shop Application",
    "jiraProject": "SHOP"
  },
  
  "subproject": {
    "code": "FE",
    "name": "Frontend",
    "workspace": "apps/frontend",
    "jiraComponent": "Frontend"
  },
  
  "context": {
    "problem": "What problem are we solving?",
    "constraints": ["Technical constraints"]
  },
  
  "links": {
    "pr": "https://github.com/org/repo/pull/123",
    "jira": "https://company.atlassian.net/browse/SHOP-123"
  },
  
  "timestamps": {
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  }
}
```

**Backward compatibility:**
- ✅ Old v1.0 string format for `context` still valid
- ✅ Old array format for `links` still valid
- ✅ Old `date_created`/`date_updated` fields still supported

#### Risk Schema (v2.0) ✅

**New v2.0 fields added:**

```json
{
  "schema": "provenancecode.risk.v2",
  "risk_id": "RA-SHOP-SEC-000001",
  
  "project": {
    "code": "SHOP",
    "name": "Shop Application"
  },
  
  "subproject": {
    "code": "SEC",
    "name": "Security",
    "workspace": "packages/security"
  },
  
  "timestamps": {
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  }
}
```

### Monorepo Support ✅

**Full v2.0 monorepo support:**

```bash
# Configure monorepo
prvc config monorepo --roots="apps/frontend,apps/backend,packages/shared"
```

**codes.json with monorepo:**

```json
{
  "schema": "provenancecode.codes@1.0",
  "monorepo": true,
  "projects": {
    "PLATFORM": {
      "subprojects": {
        "FE": {
          "workspace": "apps/frontend",
          "paths": ["apps/frontend/**"]
        },
        "BE": {
          "workspace": "apps/backend",
          "paths": ["apps/backend/**"]
        }
      }
    }
  }
}
```

### Jira Integration Support ✅

**Schema supports Jira integration:**

- ✅ `project.jiraProject` field
- ✅ `subproject.jiraComponent` field
- ✅ `links.jira` for ticket URLs

**Example with Jira:**

```json
{
  "decision_id": "DEC-SHOP-FE-000001",
  "project": {
    "code": "SHOP",
    "jiraProject": "SHOP"
  },
  "subproject": {
    "code": "FE",
    "jiraComponent": "Frontend"
  },
  "links": {
    "jira": "https://company.atlassian.net/browse/SHOP-123"
  }
}
```

## 🔄 Backward Compatibility

The CLI maintains full backward compatibility:

### v1.0 Format Still Valid ✅

```json
{
  "schema": "https://provenancecode.org/schemas/decision.g2.schema.json",
  "decision_id": "DEC-000001",
  "title": "Old format decision",
  "status": "draft"
}
```

**The CLI will:**
- ✅ Validate v1.0 format
- ⚠️  Warn that v2.0 schema identifier is preferred
- ✅ Accept both formats in same repository

### Mixed Formats Supported ✅

A repository can contain:
- v1.0 decisions: `DEC-000001`
- v2.0 decisions: `DEC-SHOP-FE-000001`
- Both coexisting peacefully

## 📊 Changes Summary

| Feature | Before | After (v2.0) |
|---------|--------|--------------|
| **Schema ID** | URL-based | Standard identifier |
| **Decision ID** | `DEC-{APP}-{AREA}-{SEQ6}` | `DEC-{PROJECT}-{SUBPROJECT}-{SEQ6}` |
| **Risk ID** | `RSK-{APP}-{AREA}-{SEQ6}` | `RA-{PROJECT}-{SUBPROJECT}-{SEQ6}` |
| **Code format** | Any length | 2-4 chars (validated) |
| **codes.json** | ❌ Not created | ✅ Auto-created |
| **sequences.json** | ❌ Not created | ✅ Auto-created |
| **Monorepo** | Basic support | Full v2.0 support |
| **Jira** | Not in schema | Schema supports |

## 🧪 Testing Results

### Install Command ✅
```bash
✓ Creates provenance/ structure
✓ Creates codes.json with correct schema
✓ Creates sequences.json with correct schema
✓ Templates use v2.0 schema identifiers
✓ Config uses v2.0 standard
```

### Config Command ✅
```bash
✓ Validates project code format (2-4 chars)
✓ Validates subproject code format (2-4 chars)
✓ Auto-updates codes.json registry
✓ Creates projects and subprojects automatically
```

### Validation ✅
```bash
✓ Validates v2.0 ID format
✓ Validates v2.0 schema identifiers
✓ Warns on old schema URLs
✓ Still accepts v1.0 format
```

## 📚 References

- [ProvenanceCode v2.0 Standard](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/)
- [Decision Schema Spec](https://provenancecode.github.io/ProvenanceCode/standard/decision-evidence-objects/)
- [Monorepo Support](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/#monorepo-support)
- [Jira Integration](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/#jira-integration)

## ✅ Compliance Statement

**The ProvenanceCode CLI is fully compliant with the ProvenanceCode v2.0 standard as published at [provenancecode.github.io](https://provenancecode.github.io/ProvenanceCode/standard/provenancecode-v2/).**

All features, formats, and behaviors align with the official specification while maintaining backward compatibility with v1.0.

---

**Last Updated:** 2026-02-17  
**Standard Version:** v2.0  
**CLI Version:** 1.0.0

