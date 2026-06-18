# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


