# Security policy

Report vulnerabilities privately using this repository’s **Security → Report a vulnerability**
feature. Do not put credentials, private visitor data, or exploitable details in a public issue.
If private reporting is unavailable, use the existing private LinkedIn contact on the site.

## Trust boundaries

- GitHub Pages serves static HTML, CSS, JavaScript, images, and fonts. There is no PHP interpreter,
  server template evaluation, account system, upload endpoint, or server filesystem to traverse.
- The Cloudflare Worker is the only application backend. D1 bindings and the private rate-limit
  salt stay in Cloudflare; no browser-facing credential exists. Do not publish `.env`, `.dev.vars`,
  local databases, scan tokens, logs containing secrets, or incoming originals.
- API route/reaction IDs, origins, methods, content type, UUIDs, and bounded request bodies are
  validated. SQL is fixed and parameterized. Database uniqueness preserves idempotency and totals.
- Content formatting escapes HTML and restricts link protocols. Astro supplies hashed CSP; external
  links isolate their opener and referrer. No third-party embeds or arbitrary HTML inputs are accepted.
- Dependency pins, provenance checks, secret scanning, CodeQL, Semgrep, Trivy, and runtime/browser
  tests complement manual review. A clean scan is evidence, not a guarantee of zero vulnerabilities.

Public implementation details are not secrets and are not the security boundary. GitHub cannot
hide selected files within a public repository, and browser-delivered code is visible by design.
The Worker stays alongside its tests and migrations to avoid an unnecessary private-repo deployment
and contract-sync workflow. Already published Git history cannot be made confidential retroactively.

## Changes and reporting

Carson is the only current write/admin collaborator and the CODEOWNER. Protected `main` requires
the current quality/security checks, disallows force pushes and deletion, and resolves review
conversations. Owner-specific review bypass does not disable required CI checks. Review access
before granting another collaborator or integration write permissions.

Keep [architecture documentation](docs/architecture/overview.md), the public privacy notice, and
the release notes aligned whenever a trust boundary, storage purpose, API contract, or deployment
changes. Use environment variables for local SonarQube authentication; never commit a scan token.

Supported production is the latest published release. Report a reproducible issue with the version,
affected route, expected/observed behavior, and a redacted reproduction. Avoid destructive tests,
quota exhaustion, real visitor data, or modifying production reaction totals.

Prepared 1.1.2 diagnostics use bounded local component/category/release codes and public deployment
identity. Worker failures return fixed categories without exception text, SQL, secrets or stored
identifiers; `/health` is a read-only schema/configuration probe, not a data or configuration dump.
Neither browser reporting nor provider request logging is enabled. See the
[operations and recovery limits](workers/reactions/OPERATIONS.md), including why restoring old
data can resurrect erased identifiers and why accepted concurrent votes are not atomically erased.
