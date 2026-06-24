# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Active |
| 1.x     | ❌ End of life — upgrade to 2.x |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately to:

**Email:** security@embankai.com  
**Subject prefix:** `[SECURITY] provenancecode-cli`

### What to include

- Description of the vulnerability and its potential impact
- Steps to reproduce (with a minimal example where possible)
- The version(s) of `provenancecode-cli` affected
- Any known mitigations or workarounds

### What to expect

1. **Acknowledgement** within 48 hours of your report
2. **Triage and severity assessment** within 5 business days
3. **Fix or mitigation** released as soon as possible — critical issues within 7 days
4. **CVE assignment** requested for confirmed vulnerabilities
5. **Credit** given in the release notes unless you prefer anonymity

We follow [coordinated disclosure](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html): we ask that you give us reasonable time to patch before any public disclosure.

## Scope

This security policy covers the `provenancecode-cli` npm package (`prvc`). It does not cover:

- The ProvenanceCode SaaS API (`apps/api`) — report those separately
- Third-party dependencies — report those to their respective maintainers

## Supply chain integrity

Every release published from v2.2.0 onwards is signed with npm provenance via [Sigstore](https://sigstore.dev). You can verify a package's provenance with:

```bash
npm audit signatures provenancecode-cli
```

This confirms the package was built from the `provenancecode/prvc` GitHub repository by the official GitHub Actions publish workflow — and was not tampered with between build and publication.
