# Reaction operations and recovery

These procedures describe the existing free-tier Worker and D1 deployment. They do not authorize
production changes. Use the verified `daysforth` profile from this directory. Keep exports, receipts,
bookmarks, credentials and database contents outside this public repository. Never use real visitor
data in tests or add synthetic production votes.

## Identify and diagnose a deployment

Record the reviewed Git SHA, package version, provider Worker version ID, applied migrations and UTC
deployment time together in the private release receipt. The read-only `GET /health` returns the
package release and `X-Daysforth-Worker-Version` identifies the actual serving artifact. Compare that
UUID with the receipt and Cloudflare's Worker Deployments view. `unavailable` means the version
metadata binding was absent or invalid; a package version alone cannot distinguish rebuilds.
The [version metadata binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)
adds deployment identity without request logging or an analytics binding.

Health is uncached and checks required schema objects, absence of the retired decrement trigger,
the database read contract and presence of valid-length secret configuration. It returns no table
contents, identifiers, origin configuration, secret or database ID. It does not prove writes, cron
execution, data correctness, available quota or every provider region. Do not poll it per visitor.

All service responses identify the package release in `X-Daysforth-Release`. Unavailable responses
carry one safe code: `REACTIONS_CONFIGURATION`, `REACTIONS_SCHEMA`, `REACTIONS_STORAGE` or
`REACTIONS_INTEGRITY`. The last indicates that a confirmed mutation had no corresponding total.
Investigate that condition before retrying maintenance. Codes disclose no exception text or SQL.
Browser reaction reads and votes have a five-second deadline covering headers and body consumption;
timeouts release pending controls and permit a deliberate retry using the same idempotent identity.
An aborted client cannot undo a request already accepted by the Worker.

For a failed interaction, record only the operation (counts, vote, erasure or health), status/code,
package release, Worker version ID, coarse elapsed time and whether a retry succeeded. Do not copy
request bodies, network addresses, visitor hashes/UUIDs, preference values or browsing-history URLs.
Use a sanitized local reproduction and the focused API/service tests for deeper investigation.

## Availability and scheduled retention

Request logging remains disabled. No logs, traces, monitoring vendor, telemetry endpoint or new
retention store is enabled by this change. Existing provider aggregate request/error and D1 row
metrics can reveal capacity problems. Verify current account settings rather than assuming source
configuration proves provider retention. Console warnings are local diagnostics, not remote alerts.

The expected cron expression is `17 * * * *`. In the Worker dashboard, open Settings, Trigger Events,
View events; compare recent outcomes with expected hourly invocations. Cloudflare documents this
bounded [Cron Events history](https://developers.cloudflare.com/workers/configuration/cron-triggers/#view-past-events)
separately from optional Workers Logs. Cleanup rejections deliberately propagate to the invocation
outcome. A successful health check does not establish that cleanup ran. Inspect expired-row counts
privately if outcomes are absent/failed; do not print hashes or delete rows as a diagnostic.

There is no proactive external alert or browser error aggregation today. If that gap becomes costly,
the concrete next proposal is an owner-run scheduled check of only `/health`, retaining UTC minute,
status, bounded code and deployed version for seven days, notifying only on state change. It would
make no reaction writes and collect no visitor events. Destination, cadence, notification channel,
provider retention and authorization must be agreed before enabling it. Provider request logging
is not required for this proposal.

## Compatibility and rollout

Migrations 0001–0003 remain the current schema. The audit adds no migration, salt change, data
rewrite or new reaction key. The static `src/data/published-image-reactions.json` registry preserves
all 65 image identities present in the reviewed 1.1.1 source, independently of current presentation.
Append new published image identities; never remove or repurpose an entry. Content still derives
new approved keys. Deploy a compatible additive Worker before a site that starts using new keys;
compare read-only totals before/after without adding test votes. Existing Pages builds can use this
Worker, and the site deadline change also works with the earlier response format.

POST and identity DELETE are separate database operations. An isolated SQLite regression pauses
an accepted POST before insertion, completes DELETE, then proves the POST can insert afterward.
The late row expires under normal retention and its total remains permanent. Client cancellation
or sequencing cannot establish global atomic erasure. A server tombstone/coordinator would add a
new retained identifier/protocol and change privacy behavior; consider it only if stronger erasure
guarantees are approved. Keep current best-effort wording truthful.

## Backup, restore and rollback

Before an authorized schema/deployment change, verify the account/Free plan, current artifact,
schema/migrations and read-only aggregate totals. Record a D1 Time Travel bookmark and confirm its
actual recovery window. Cloudflare currently documents seven days on Free; its
[Time Travel reference](https://developers.cloudflare.com/d1/reference/time-travel/) describes the
read-only `d1 time-travel info` and destructive restore operations. Retain the previous bookmark so
a mistaken restore can be undone. A source rollback does not restore data.

For a portable backup, use the pinned CLI's `d1 export daysforth-reactions --remote --output=<private-path>`
with `--profile daysforth`. Hash the file and record its timestamp/source receipt privately. An
[export can block other database requests](https://developers.cloudflare.com/d1/best-practices/import-export-data/),
so choose an approved quiet maintenance window. Exports include pseudonymous identifiers: restrict
access and expire them on an approved short schedule. Do not create a new indefinite archive of
expired or erased identities. No remote export or restore was performed during this audit.

Rehearse recovery using synthetic data in an isolated local database first. Import into a blank
target, inspect trigger ordering, and verify the restored aggregate snapshot exactly: retained
identifier rows cannot reconstruct permanent totals after erasure/retention. If assembling a
restore manually, suspend `reaction_added` while restoring historical rows/totals, then reinstall
the reviewed trigger before admitting writes. The isolated recovery regression demonstrates this
order and a subsequent new vote. Never add replayed historical votes onto existing totals.

A production restore overwrites data and may lose newer legitimate totals or resurrect identifiers
erased since the checkpoint. Obtain owner approval for the exact restore point and reconciliation
plan, preserve the current snapshot/bookmark, stop writes through an approved maintenance change,
and account for these consequences before executing it. Do not improvise a reset or rebuild totals
from `reactions`. Verify schema, totals, index plans, read-only health and the serving artifact before
resuming traffic. Keep a receipt of what actually ran and any unrecoverable interval.

For a bad code deployment with intact data, roll back only the Worker artifact to a reviewed version
compatible with the current migrations, retained keys and permanent totals. Keep the salt/binding
unchanged. A pre-image allowlist rollback can reject newer site requests; either keep an additive
compatible Worker or coordinate a site rollback. Never reinstate the decrement trigger.

## Retention growth measurement

The current hourly timestamp delete scans `reactions`. A November 5 synthetic in-memory SQLite
measurement on Windows/Node 24.19 used one expired row, all remaining rows fresh, and ten rolled-back
deletes per size; median handling times were:

| Retained rows | Current scan | Hypothetical timestamp index |
| ------------- | ------------ | ---------------------------- |
| 100           | 0.0074 ms    | 0.0086 ms                    |
| 10,000        | 0.2301 ms    | 0.0074 ms                    |
| 100,000       | 2.7083 ms    | 0.0080 ms                    |

These exclude D1/network transfer, provider scheduling and browser rendering. All current plans
were `SCAN reactions`; the experimental index produced `SEARCH reactions USING INDEX
reactions_created_at (created_at<?)`. No production volume or current latency was inferred.
Hourly scans at 200,000 retained rows would inspect roughly 4.8 million rows/day before request
traffic. Compare actual D1 row metrics before that scale: the current
[Free allowance](https://developers.cloudflare.com/d1/platform/pricing/) is 5 million rows read/day,
and an added index also increases per-vote writes/storage. Add a compatible timestamp index when
measured retained volume or row cost justifies it; preserve the 90-day boundary and permanent totals.

Reproduce only locally from the repository root in PowerShell:

```powershell
@'
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { readFileSync, readdirSync } from 'node:fs';
for (const size of [100, 10000, 100000]) {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync('workers/reactions/migrations').sort())
    db.exec(readFileSync('workers/reactions/migrations/' + name, 'utf8'));
  db.exec('BEGIN');
  const insert = db.prepare('INSERT INTO reactions VALUES (?, ?, ?)');
  for (let n = 0; n < size; n++) insert.run('fixture', 'hash-' + n, n === 0 ? 1 : 1800000000000);
  db.exec('COMMIT');
  const measure = () => {
    const times = [];
    for (let n = 0; n < 10; n++) {
      db.exec('BEGIN');
      const start = performance.now();
      db.prepare('DELETE FROM reactions WHERE created_at <= ?').run(2);
      times.push(performance.now() - start);
      db.exec('ROLLBACK');
    }
    times.sort((a, b) => a - b);
    return { medianMs: times[5], plan: db.prepare('EXPLAIN QUERY PLAN DELETE FROM reactions WHERE created_at <= ?').all(2) };
  };
  const before = measure();
  db.exec('CREATE INDEX reactions_created_at ON reactions(created_at)');
  console.log(JSON.stringify({ size, before, after: measure() }));
  db.close();
}
'@ | node --input-type=module
```
