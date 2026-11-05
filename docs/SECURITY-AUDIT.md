# Daysforth 1.0.0 security review

Reviewed November 5, 2026. This record describes the implemented boundaries and actual scanner
scope; final analysis/deployment identifiers and results are recorded in the release pull request.
The maintained design is in [architecture](architecture/overview.md) and [SECURITY.md](../SECURITY.md).

## Attack surfaces reviewed

| Surface                                       | Control and verification                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PHP/server templates and filesystem traversal | Pages publishes static assets; no PHP, CGI, upload, shell, or server file-serving handler exists. Unknown paths use the static 404.                                                              |
| SQL injection                                 | Fixed D1 statements use bound values. Strict routes, approved reaction keys, UUID validation, and SQLite integration tests cover malformed inputs.                                               |
| Script injection                              | Content formatter escapes HTML and restricts link protocols; JSON-LD escapes `<`; browser updates use text APIs. Hashed CSP, self-hosted assets, and no arbitrary HTML input reduce the surface. |
| Cross-origin mutation                         | Approved Origin plus JSON content type are required. CORS is not authentication or protection against a client that deliberately spoofs headers.                                                 |
| Quota abuse                                   | Bodies stop at 512 bytes. New votes and identity erasures have independent network/hour limits of 20. Database uniqueness preserves idempotent votes.                                            |
| Erasure lookup                                | Migration 0003 indexes `visitor_hash`. An integration test checks the actual query plan, avoiding the previous full-table scan for each erase request.                                           |
| Data exposure                                 | Browser choices require consent. Raw IPs/UUIDs are not stored by application SQL; salted hashes have disclosed retention. Provider bindings/salt and local tokens stay outside Git.              |
| External destinations                         | Explicit links open isolated new tabs; no remote players, analytics, or tracking embeds load on page view.                                                                                       |
| Dependency/build compromise                   | Exact lockfile pins, no install hooks, registry provenance/signatures, SHA-pinned Actions, digest-pinned scanner engines, secret scans, and owner-controlled releases.                           |

The counter remains deliberately anonymous and lightweight. Clearing or expiring an identifier can
permit another reaction. Rate limits mitigate ordinary quota abuse; they are not identity proof,
fraud prevention, or an unlimited DDoS capacity guarantee.

## Findings resolved

- Added the indexed erasure lookup and independent erase quota without reducing permanent totals,
  changing the reaction bucket namespace, rotating the secret salt, or losing existing identities.
- Updated `fflate` to 0.8.3 for CVE-2026-45820. Updated the development-only `minimatch` tree to
  11.0.1 for CVE-2026-118764. The documented cooldown exception includes its required
  `@isaacs/nonrecursive-glob-match` 1.0.3 dependency; both are from the October 27–28 fixed release.
  The required `brace-expansion` 5.0.12 predates the normal cooldown. Full compatibility gates apply.
- Split overly complex HTTP, preference, post-action, and release-policy responsibilities. Removed
  duplicated data shapes/CSS selectors and corrected the historical wireframe semantics/styles.
- Added real adapter, CLI, configuration, and browser-entry composition tests. Coverage now includes
  these files rather than excluding them from Sonar or manufacturing a coverage report.

## Tools and scope

Semgrep 1.176.1 runs the official security-audit, TypeScript, JavaScript, and GitHub Actions packs
with metrics disabled. Its engine image is digest pinned in CI. Trivy 0.74.0 scans filesystem
dependencies including development packages, source secrets, and supported misconfiguration types.
Its database is refreshed normally. Generated output, dependency trees, `.git`, and private incoming
originals/local deployment state are not first-party scan targets. Application source is not hidden
to avoid a finding. Knip and jscpd run with the existing zero-unused/zero-duplication gates.

SonarQube runs locally at `127.0.0.1:9000` with repository-wide source scope, tests classified
separately, and genuine Vitest LCOV. No source, coverage, or duplication exclusions were added.
The project-specific gate requires 100% coverage, zero duplication, bugs, vulnerabilities, and code
smells, plus 100% hotspot review. It does not modify other local projects’ gates.

The three PATH hotspots were reviewed against their actual CLI call sites: fixed Git/npm commands,
separate/static arguments, trusted local toolchains, and controlled hosted-runner PATH. Visitor
requests/content cannot reach these developer tools. They were classified safe with that rationale,
not silently ignored. A compromised development toolchain is outside the HTTP application boundary.

## Repository controls and remaining limits

The active **Owner-reviewed main** ruleset grants a pull-request-only review bypass to user
`carsonmcrae` (65742229), not to every administrator or integration. Separate branch protection still
requires strict CI/CodeQL/dependency checks, resolves conversations, and blocks force pushes/deletion.
Carson is the only current write/admin collaborator and the global CODEOWNER. Private vulnerability
reporting is enabled. Recheck these controls whenever permissions or CI jobs change.

The separate Published version tags ruleset blocks updates and deletion of `v*` tags with no bypass,
preserving the source identity of a published release. Initial creation remains subject to repository
write access; Carson is the sole current writer.

Public source remains inspectable, including already published history. Keeping implementation
private would not protect browser-delivered code or replace these controls, so no private-backend
migration was added. Restrictive ownership notices govern reuse without creating tracking canaries.

Scanners do not prove the absence of every possible vulnerability or provider-level risk. Fresh
NVDA and VoiceOver evaluation remains separately disclosed; this source/security review is not an
accessibility or legal certification. Reassess the architecture before adding accounts, uploads,
payments, forms, new data purposes, or materially larger traffic.
