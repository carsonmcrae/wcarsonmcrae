# Deploying Daysforth for free

The canonical address is **https://wcarsonmcrae.com/**. **daysforth.com** and its `www` host forward
to that address. GitHub Pages hosts the static frontend; Cloudflare Free supplies DNS, edge
protection, redirects, and the Worker/D1 reactions service. GoDaddy remains the registrar.
No paid upgrade or usage plan is authorized.

On November 4, 2026, Carson explicitly authorized the agent to merge, enable Pages, deploy,
configure Cloudflare/reactions, and update DNS. This overrides the standing owner-only rule for
this release. The separate `carsonmcrae.github.io` portfolio repository remains unchanged.

## Configuration

- Pages source: **GitHub Actions**. Custom domain: **wcarsonmcrae.com**. Actions use the Pages
  setting rather than a CNAME file. Local builds also default to the personal domain.
- Repository variable `PUBLIC_REACTIONS_URL`:
  `https://daysforth-reactions.wcarsonmcrae.workers.dev`.
- Worker and D1 database: `daysforth-reactions`; binding: `DB`. Its account/database IDs are public
  configuration in `wrangler.toml`; the salt remains encrypted in Cloudflare secrets.
- The isolated `daysforth` Wrangler profile is bound only to `workers/reactions/`. Verify its
  account before deployment; the default CLI profile belongs to another project.
- Workers and both zones use Free. Version previews, logs, traces, and Issues are off.
- Bot Preference Sync is off by Carson's explicit choice; retain the app's own robots.txt.

## DNS and TLS

Both domains' original DNS tables were saved outside Git before modification. The primary's
original zone file was exported. Preserve DMARC, Domain Connect, and unrelated records. Neither
zone had MX records or enabled DNSSEC at migration time. Never introduce wildcard records.

The primary's assigned nameservers are `kara.ns.cloudflare.com` and `kevin.ns.cloudflare.com`.
Use the exact pair assigned to each zone in GoDaddy's custom nameservers.

| Type  | Primary host | Origin value          |
| ----- | ------------ | --------------------- |
| A     | @            | 185.199.108.153       |
| A     | @            | 185.199.109.153       |
| A     | @            | 185.199.110.153       |
| A     | @            | 185.199.111.153       |
| CNAME | www          | carsonmcrae.github.io |

Start these records DNS-only for GitHub's domain validation and certificate issuance. Once its
certificate is valid, enforce HTTPS in Pages and proxy the web records through Cloudflare.
Use **Full (strict)** encryption, never Flexible. Leave Domain Connect DNS-only.

Daysforth uses proxied redirect-only records with reserved documentation addresses. A single 301
rule matches its apex and www over HTTP/HTTPS, redirects to `https://wcarsonmcrae.com` plus the
original path, and preserves the query string. It serves no origin content. Verify before sign-off.

## Hardening and release checks

Keep the app's hashed-script/style CSP in HTML. Add edge headers for `frame-ancestors 'none'`,
`X-Frame-Options: DENY`, nosniff, a strict referrer policy, and disabled camera/microphone/geolocation.
Set HSTS only after HTTPS works, without includeSubDomains or preload. Keep script/HTML rewriting
and analytics features off so CSP hashes match and the privacy statement stays accurate.

Reactions require an approved Origin and JSON for writes, cap bodies at 512 bytes, deduplicate in
SQL, hash browser/network identifiers with a private salt, and limit new votes to 20/network/hour.
Only the primary apex/www are allowed in production. CORS is a browser boundary, not identity proof.
Quota exhaustion leaves the feed and local Save usable. Salt rotation changes deduplication IDs.
See [the service guide](../workers/reactions/README.md).

Run `npm run validate:full` and inspect CI, CodeQL, and Dependency review. Merge into the existing
review base, then establish main from that reviewed result and make it the default, avoiding the
historical site's accidental publication. Every main push runs the quality gate before deploying.

Verify all four domain/host variants over HTTP/HTTPS, deep paths and queries, direct post/secondary
pages, custom 404, canonical tags, robots, sitemap, share images, security headers, both themes,
keyboard controls, and the real brand ZIP. Verify shared totals and duplicate protection across
browsers; remove exact test votes. Record actual outcomes in design-qa.md.

VoiceOver on macOS/iOS and native Safari download verification remain outstanding. Windows NVDA
and automated WebKit do not establish conformance. Carson authorized publication with these
limitations recorded.

## Rollback

Revert the release commit on main or unpublish Pages. Restore prior DNS from the saved inventories
if needed. Never delete protected photo originals, backups, or real reactions. SQL triggers maintain
totals after targeted vote deletion. A Worker rollback must remain compatible with its schema.

## Official references

- [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Cloudflare nameserver setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Free redirect quotas](https://developers.cloudflare.com/rules/url-forwarding/)
- [Response header rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
