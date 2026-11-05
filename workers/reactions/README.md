# Daysforth shared reactions

A small Cloudflare Worker with D1 persistence. The site itself is a static GitHub Pages deployment.
Use the Workers Free plan and D1’s free allowance; do not enable a paid plan or automatic upgrades.
An outage or quota limit leaves the feed, Save, and Copy link usable.

## Contract

- `GET /reactions` returns a count for each approved moment/image reaction key.
- `POST /reactions/<id>` accepts `{ "visitorId": "<browser UUID>" }` and returns `{ "count": 1 }`.
- Reactions are permanent. `DELETE /reactions/<id>` returns 405.
- `DELETE /identity` accepts the same UUID and removes its deduplication records without changing
  aggregate counts. It cannot remove another browser’s records without knowing its random UUID.
- Heart keys remain the published moment ID. Image targets use `photo-<canonical asset stem>` for
  photographs and `screen-<canonical asset stem>` for interface captures. The same asset shares its
  count across pages, albums, responsive sizes, and related moments; a photo reaction never changes
  its moment's count. These namespaces are reserved for images.
- Celebrate, Smile, and Applaud use the stable suffixes
  `--celebrate`, `--laugh`, and `--support`. Each option can be added independently, once per identity.
- An existing browser/reaction-key pair is idempotent. SQL uniqueness and the insert trigger prevent
  duplicate totals, including concurrent submissions. The removal trigger is retired by migration 0002.
- New votes and identity-erasure requests each have a separate allowance of 20 per network per hour.
  Existing votes remain idempotent without consuming a new-vote allowance. Repeated erasure requests
  are idempotent but consume the erasure allowance; an exhausted allowance returns 429 with Retry-After.
  Browser preferences can still be cleared. Bodies are limited to 512 bytes.
- POST and DELETE require an approved Origin and JSON content type. Production permits only the personal
  domain and its www host; local development origins must be explicitly configured locally.
- Raw browser identifiers and network addresses are never stored. SHA-256 hashes use a private salt.
- Expired rate-limit buckets are deleted hourly. Vote hashes become eligible for deletion after
  90 days; hourly cleanup removes them without reducing permanent aggregate totals.
- The browser persists the UUID and selected choices only after optional-storage permission.
  Without permission, votes work with an identifier in memory for the current document.

The implementation lives in `src/lib/reaction-service.ts`; the Worker entry only supplies bindings
and the pure `src/data/reaction-targets.ts` allowlist. That registry derives image IDs from approved
content rather than every file in the asset directory, and preserves published moment aliases.
Published image stems are permanent identities: retain retired image IDs in the registry if their
presentation is removed, and never repurpose an existing ID for a different photograph. Unit tests
execute the real migrations and queries against in-memory SQLite.

The browser's `reaction-controller.ts` shares identity, consent-gated choices, validated requests,
and in-flight same-key deduplication between post controls and the photo viewer. DOM adapters own
their own labels, counts, loading races, and feedback; image reactions do not acquire Save/Copy state.

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

For the permanent-reactions release, first apply migration 0002 remotely using the `daysforth`
profile, then deploy the Worker, then publish the frontend. Never reset totals or rotate the salt.
Migration 0002 drops only the decrement trigger; it preserves every existing vote and total.
The three retired app-start event IDs remain accepted for compatibility.

For photo reactions, deploy the additive Worker allowlist before publishing the frontend. This
change needs no SQL migration, new database, binding change, or salt rotation. Preserve every
existing moment key and permanent total. Take read-only before/after count snapshots and verify
that old totals do not decrease while approved image keys become available with their real counts.
All moment and image votes share the existing 20 new reactions per network/hour allowance;
images do not receive an additional quota. Existing service cleanup and identity erasure cover both.

Before deploying the bounded-erasure update, apply migration 0003 using the same guarded profile.
It adds only a visitor-hash index so identifier erasure uses an indexed lookup instead of a full
table scan. The Worker separately bounds erasure requests by network/hour, using a distinct salted
bucket namespace. Existing reaction bucket hashes, identifiers, totals, and the salt remain unchanged.

Operator canary cleanup now requires a guarded transaction affecting only the known test UUID hash
and its exact reaction key. Remove the exact test row and subtract exactly its one test increment;
identifier erasure by itself deliberately leaves the total. Never broadly delete reactions or infer
that every nonzero count is test data. Preserve real visitor votes and retain read-only before/after
snapshots outside Git. Worker rollbacks must remain compatible with permanent totals.

## Local verification

Run the migration with `--local`, then `npx wrangler@4.151.3 dev --local`. Supply a test-only
`RATE_LIMIT_SALT` in an ignored `.dev.vars` file. Never use the production salt for local tests.
Set `PUBLIC_REACTIONS_URL` to the local Worker URL before building the site for an integration run.

The account-wide Free allowances currently include 100,000 Worker requests/day; D1 includes
5 million rows read/day and 100,000 rows written/day. Check the official
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) before enabling the service.
