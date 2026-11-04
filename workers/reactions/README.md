# Daysforth shared reactions

A small Cloudflare Worker with D1 persistence. The site itself is a static GitHub Pages deployment.
Use the Workers Free plan and D1’s free allowance; do not enable a paid plan or automatic upgrades.
An outage or quota limit leaves the feed, Save, and Copy link usable.

## Contract

- `GET /reactions` returns a count for each approved moment.
- `POST /reactions/<id>` accepts `{ "visitorId": "<browser UUID>" }` and returns `{ "count": 1 }`.
- An existing browser/moment pair is idempotent. SQL uniqueness and insert/delete triggers keep
  totals consistent, including concurrent submissions and targeted operator cleanup.
- New votes are limited to 20 per network per hour. Bodies are limited to 512 bytes.
- POST requires an approved Origin and JSON content type. Production permits only the personal
  domain and its www host; local development origins must be explicitly configured locally.
- Raw browser identifiers and network addresses are never stored. SHA-256 hashes use a private salt.
- Expired rate-limit buckets are deleted hourly. Vote hashes remain to prevent duplicate votes.

The implementation lives in `src/lib/reaction-service.ts`; the Worker entry only supplies bindings
and approved post IDs. Unit tests execute the real migration and queries against in-memory SQLite.

## Deployment

Use the existing signed-in Cloudflare account only after confirming its Workers plan is Free.
Commands below use the pinned, eligible CLI checked on November 4, 2026.

The existing `daysforth` Wrangler profile is bound only to this directory. It uses the Cloudflare
account pinned in `wrangler.toml`, preserving the unrelated default login. Never deploy this service
using an unverified account. The database is already provisioned; do not create a second copy.

For a fresh installation only:

1. In this directory, run `npx wrangler@4.151.3 d1 create daysforth-reactions --profile daysforth`.
2. Put the returned database ID in `wrangler.toml`.
3. Run `npx wrangler@4.151.3 d1 migrations apply daysforth-reactions --remote`.
4. Set a cryptographically random secret with `npx wrangler@4.151.3 secret put RATE_LIMIT_SALT`.
   Use at least 32 characters. Do not put the value in Git, command arguments, screenshots, or logs.
5. Run `npx wrangler@4.151.3 deploy`.
6. Set the returned Worker URL as the GitHub repository variable `PUBLIC_REACTIONS_URL`, then rebuild
   the site. The URL is public; no browser-facing secret is needed.

The production endpoint is `https://daysforth-reactions.wcarsonmcrae.workers.dev`. Version preview
URLs are disabled. Request logs/observability are disabled, and rate buckets expire hourly. Keep the
salt in Cloudflare secrets; changing it resets anonymous deduplication identities.

## Local verification

Run the migration with `--local`, then `npx wrangler@4.151.3 dev --local`. Supply a test-only
`RATE_LIMIT_SALT` in an ignored `.dev.vars` file. Never use the production salt for local tests.
Set `PUBLIC_REACTIONS_URL` to the local Worker URL before building the site for an integration run.

The account-wide Free allowances currently include 100,000 Worker requests/day; D1 includes
5 million rows read/day and 100,000 rows written/day. Check the official
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) before enabling the service.
