# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-06-24

### Fixed — Starter pack correctness and security hardening

#### `prvc starterpack add cursor` — rules and hook scripts now emit v2.0 content
- **`generateCursorRules()`** completely rewritten — previously emitted obsolete G2/v2.0 content; now generates the full ProvenanceCode Standard v2.0 rules covering DEO decisions, RA risks, SPEC, MR, TAP, ACT, and MEO artifacts.
- **`generateClaudeRules()`** and **`generateAntigravityRules()`** updated to use `id_format.project` / `id_format.subproject` from the current config instead of the removed legacy `defaultAppCode` / `defaultArea` fields. Running these generators on a DEO v1.0 config no longer produces `undefined` literals in the output.
- **`generateSessionStartScript()`** synced with the improved installed hook: now performs a `GET /agents/{tenant}/{agentId}` pre-check before registering, uses the full capability list (`k8s.*`, `terraform.*`, `helm.*`, `gcloud.*`), and emits a JSON `additional_context` response.

#### `prvc tap done` — new lifecycle transition action
- Added `done` (alias: `close`) action to the `tap` command.
- Usage: `prvc tap done TAP-000001 [--outcome succeeded|failed|blocked|partial] [--human-review]`
- Sets `lifecycle.state`, `timestamps.ended_at`, `timestamps.attested_at`, and marks `enforcement.validated: true`.
- Idempotent: warns and exits cleanly if the TAP is already closed.

#### `prvc validate` — `--track` flag and full artifact counts
- Added `--track <repo|runtime|all>` option (default: `all`).
- Validate display now reports counts across all 7 artifact types: DEO, RA, SPEC, MR, TAP, ACT, MEO — replacing the old decisions/risks-only count.

#### `types.ts` — stricter lifecycle state types
- Added `TapLifecycleState` and `MeoLifecycleState` union types aligned with the JSON schemas.
- `TapRecord.lifecycle.state` and `MeoRecord.lifecycle.state` now use these types instead of `string`.

#### Security — OWASP NPM Security Cheat Sheet hardening

**OWASP #1 — Avoid publishing secrets:**
- **CRITICAL**: Removed hardcoded npm auth token from `.npmrc`. Token now uses `${NPM_TOKEN}` environment variable interpolation (never committed to git).
- Replaced the `.npmignore` denylist with an explicit `files` allowlist in `package.json` — only `dist/`, `README.md`, and `LICENSE` are published. This is the primary control; all other files (source, docs, `.cursor/`, `.github/`) are excluded by default.

**OWASP #2 — Enforce the lockfile:**
- CI publish workflow uses `npm ci` (not `npm install`) to ensure deterministic, lockfile-enforced installs.

**OWASP #3 — Minimize attack surfaces:**
- Added `ignore-scripts=true` to `.npmrc` — prevents arbitrary postinstall scripts from third-party packages executing during install.

**OWASP #5 — Audit for vulnerabilities:**
- `prepublishOnly` now runs `npm audit --audit-level=high` before every publish. Releases with high/critical CVEs in dependencies will fail to publish.
- CI workflow runs a dedicated audit step before building.

**OWASP #7 — Responsible disclosure:**
- Added `SECURITY.md` with private reporting address, triage SLA, and coordinated disclosure policy.

**OWASP #11 — Trusted publishers (OIDC):**
- Added `.github/workflows/publish.yml` — publishes via GitHub Actions OIDC, eliminating long-lived npm tokens from CI. Uses `npm publish --provenance` to attach a Sigstore attestation to every release.
- Publish workflow validates the tarball contents before publishing (fails if any `src/`, `.npmrc`, or `.env` files are detected in the tarball).

**Additional hardening:**
- `.gitignore` expanded to cover `.env.*`, `*.pem`, `*.key`, `*.cert`, and `secrets/`.
- Source maps (`"sourceMap": false`, `"declarationMap": false` in `tsconfig.json`) — internal TypeScript structure not recoverable from the published package.

---

## [Unreleased] - 2026-05-08

### Added — `prvc starterpack add cursor` enhancements

- **Cursor hooks directory** — `installCursorPack` now creates `.cursor/hooks/` in addition to `.cursor/rules/`.
- **`hooks.json` merge logic** — Reads any existing `.cursor/hooks.json` and merges ProvenanceCode entries, preserving third-party hooks already registered.
  - `sessionStart` hook: `.cursor/hooks/prvc-session-start.sh` (timeout 10 s)
  - `beforeShellExecution` hook: `.cursor/hooks/prvc-shell-guard.sh` with regex matcher `^\s*(aws|kubectl|terraform|helm|gcloud)\s` (failClosed: false, timeout 35 s)
- **Shell guard script** (`prvc-shell-guard.sh`) — Intercepts governed CLI commands (aws, kubectl, terraform, helm, gcloud), POST-checks each against the ProvenanceCode policy API (`/actions`), and returns `allow`, `deny`, or `ask` JSON. Fails open when the API is unreachable. Logs completion asynchronously to avoid blocking the shell.
- **Session start script** (`prvc-session-start.sh`) — On Cursor session start, checks API health and auto-registers the Cursor agent (`/agents`). Outputs `additional_context` YAML for the agent with API URL, agent ID, tenant, dashboard URL, and governed command list.
- **MCP server config** (`mcp.json`) — Generates `.cursor/mcp.json` pointing at `@provenancecode/mcp-server` (via `npx -y`) with environment variable placeholders for `PROVENANCECODE_API_URL`, `PROVENANCECODE_PAT`, `PROVENANCECODE_TENANT_ID`, `PROVENANCECODE_AGENT_ID`, and `PROVENANCECODE_DASHBOARD_URL`. Skipped if the file already exists.
- **New generator functions** in `src/commands/starterpack.ts`:
  - `generateMcpConfig()` — produces the `mcpServers` object for `.cursor/mcp.json`.
  - `generateShellGuardScript()` — produces the bash shell-guard hook.
  - `generateSessionStartScript()` — produces the bash session-start hook.
- **Improved CLI output** — `installCursorPack` now collects all created file paths in a `created[]` array and lists them together. The "What this does" section was updated to describe MCP tools, shell governance hooks, and session-start registration. A new "Next steps" section instructs users to set the four required environment variables and restart Cursor.

### Changed

- `installCursorPack` — refactored from a single-file writer to a multi-artifact installer. File list is now dynamically collected rather than hard-coded.

---

## [2.0.0] - 2026-05-06

### Added — DEO v1.0 migration

- **DEO v1.0 schema** (`src/schemas/decision.v1.schema.json`) — new canonical schema aligned with the Decision Evidence Object standard.
- **`migrate --to-deo` flag** — migrates existing G2/v2 records to DEO v1.0 format.
- **`init --standard deo`** — bootstraps a repository with DEO v1.0 structure.
- **DEO-specific `journal add` flags**: `--outcome`, `--rationale`, `--risk-level`, `--bot`, `--author`. The legacy `--decision` flag is preserved as a deprecated alias for `--outcome`.
- **`install` command** — dedicated command (`prvc install`) to set up ProvenanceCode structure, separate from `init`.
- Refined `search`, `quality`, `template`, `migrate`, and `journal` commands to handle DEO v1.0 field names alongside legacy G2 field names.
- Extended `types.ts` with DEO v1.0 type definitions.
- Extended `templates.ts` with DEO-aware record generators.
- Extended `utils.ts` and `validator.ts` for DEO v1.0 compatibility.
- Comprehensive documentation suite: `CLI_ARCHITECTURE.txt`, `CLI_VS_NPM_SCRIPTS.md`, `CLARIFICATION_SUMMARY.md`, `DEPLOYMENT.md`, `V2_COMPLIANCE.md`, `READY_TO_PUBLISH.md`, `PUBLISHED.md`, `GITHUB_RELEASE.md`.

### Changed

- CLI description updated to "Generate and validate Decision Evidence Objects (DEO v1.0)".
- `migrate` command now supports `v1→v2` and `g2→DEO v1.0` upgrade paths.

---

## [2.0.0] - 2026-02-17

### Added

- Initial release of ProvenanceCode CLI (prvc)
- G2 (v2.0) standard implementation
- `init` command to bootstrap ProvenanceCode in repositories
- `validate` command for local validation
- `starter` command to add AI assistant packs
- Support for Cursor, Claude Code, and Antigravity AI tools
- Optional GitHub CI workflow generation
- Decision and risk record templates
- JSON schema validation with AJV
- ID auto-increment per area
- Comprehensive documentation

### Features

- Decision ID format: `DEC-{APP}-{AREA}-{SEQ6}`
- Risk ID format: `RSK-{APP}-{AREA}-{SEQ6}`
- Two validation modes: `warn` and `fail`
- AI starter packs with rules and prompts
- No governance enforcement (by design)
- No telemetry or SaaS calls
- Fully local operation

[Unreleased]: https://github.com/provenancecode/prvc/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/provenancecode/prvc/releases/tag/v2.0.0


