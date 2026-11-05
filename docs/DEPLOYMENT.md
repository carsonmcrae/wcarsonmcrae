# Deploying Daysforth for free

The canonical address is **https://wcarsonmcrae.com/**. **daysforth.com** and its `www` host forward
to that address. GitHub Pages hosts and serves the static frontend directly; Cloudflare Free
supplies signed DNS, redirects, and the Worker/D1 reactions service. GoDaddy remains the registrar.
No paid upgrade or usage plan is authorized.

On November 4, 2026, Carson explicitly authorized the agent to merge, enable Pages, deploy,
configure Cloudflare/reactions, and update DNS. This overrides the standing owner-only rule for
this release. The separate `carsonmcrae.github.io` portfolio repository remains unchanged.

## Configuration

- Pages source: **GitHub Actions**. Custom domain: **wcarsonmcrae.com**. Actions use the Pages
  setting rather than a CNAME file. Builds use HTTPS plus Pages' reported hostname and path, including
  the first deployment while GitHub is provisioning its certificate. Local builds use the personal domain.
- Repository variable `PUBLIC_REACTIONS_URL`:
  `https://daysforth-reactions.wcarsonmcrae.workers.dev`.
- Worker and D1 database: `daysforth-reactions`; binding: `DB`. Its account/database IDs are public
  configuration in `wrangler.toml`; the salt remains encrypted in Cloudflare secrets.
- The isolated `daysforth` Wrangler profile is bound only to `workers/reactions/`. Verify its
  account before deployment; the default CLI profile belongs to another project.
- Workers and both zones use Free. Version previews, logs, traces, and Issues are off.
- Bot Preference Sync is off by Carson's explicit choice; retain the app's own robots.txt.
- Both zones have DNSSEC signing and matching DS records at GoDaddy. Public validating DNS responses
  were checked after delegation. Both edge configurations require TLS 1.2 or newer.

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

Keep the primary records **DNS-only**, including after enabling HTTPS in Pages. GitHub's certificate
checks expect its own addresses; proxying can prevent automatic renewal. GitHub already serves the
site through its CDN. Cloudflare's Full (strict) setting is retained as a safe default, but the
primary does not send web traffic through that proxy. Domain Connect also stays DNS-only.

Daysforth uses proxied redirect-only records with reserved documentation addresses. A single 301
rule matches its apex and www over HTTP/HTTPS, redirects to `https://wcarsonmcrae.com` plus the
original path, and preserves the query string. It serves no origin content. Verify before sign-off.

## Hardening and release checks

Keep the app's hashed-script/style CSP and strict referrer policy in HTML. GitHub controls the
primary's HTTP response headers; inspect the actual published response rather than claiming custom
Cloudflare headers apply. An optional header transform was prepared in Cloudflare, but has no effect
on the DNS-only primary. Do not enable proxying merely to activate it. The static primary has no
third-party scripts or analytics, and does not depend on a Worker request allowance to serve pages.

Reactions require an approved Origin and JSON for writes, cap bodies at 512 bytes, deduplicate in
SQL, hash browser/network identifiers with a private salt, and limit new votes to 20/network/hour.
Only the primary apex/www are allowed in production. CORS is a browser boundary, not identity proof.
Quota exhaustion leaves the feed and local Save usable. Salt rotation changes deduplication IDs.
See [the service guide](../workers/reactions/README.md).

Run `npm run validate:full` and inspect CI, CodeQL, and Dependency review. PR #1 established the
reviewed main branch as default. Its protection requires a PR, passing checks, and resolved review
conversations; force pushes and deletion are blocked, including for administrators. Every main push
runs the quality gate before deploying. See [release PR #1](https://github.com/carsonmcrae/wcarsonmcrae/pull/1)
for final live acceptance; the provisioning checkpoint in design-qa.md predates publication.

Verify all four domain/host variants over HTTP/HTTPS, deep paths and queries, direct post/secondary
pages, custom 404, canonical tags, robots, sitemap, share images, security headers, both themes,
keyboard controls, and the real brand ZIP. Verify shared totals and duplicate protection across
browsers; remove exact test votes. Record actual outcomes in design-qa.md.

VoiceOver on macOS/iOS and native Safari download verification remain outstanding. Windows NVDA
and automated WebKit do not establish conformance. Carson authorized publication with these
limitations recorded.

## Rollback

Revert the release commit on main or unpublish Pages. Restore prior records from the saved inventories
if needed. Before moving authoritative DNS away from Cloudflare, remove the DS record at GoDaddy and
wait for its cached delegation to expire, then change nameservers. Never disable signing while the
parent DS remains published: that breaks validating resolvers. Never delete protected photo originals,
backups, or real reactions. SQL triggers maintain totals after targeted vote deletion. A Worker
rollback must remain compatible with its schema.

## Official references

- [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub HTTPS and certificate checks](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Open proxy/certificate-renewal issue](https://github.com/github/pages-health-check/issues/153)
- [Cloudflare nameserver setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Free redirect quotas](https://developers.cloudflare.com/rules/url-forwarding/)
- [Response header rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
