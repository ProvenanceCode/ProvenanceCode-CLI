# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[2.0.0]: https://github.com/provenancecode/prvc/releases/tag/v2.0.0

