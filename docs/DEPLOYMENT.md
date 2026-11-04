# Deploying Daysforth for free

The intended canonical address is **https://daysforth.com/**. **wcarsonmcrae.com** and its `www`
address should forward there. The static frontend uses GitHub Pages; shared reactions use a
Cloudflare Worker and D1 on the Free plan. No paid service or upgrade is authorized.

Only Carson performs merges, deployments, repository/Pages settings changes, and DNS changes under
[AGENTS.md](../AGENTS.md). This checklist prepares his release; it does not mean deployment or DNS
changes have already occurred.

## Release order

1. Review `codex/daysforth`, `design-qa.md`, and the content checklist. Run `npm run validate:full`.
   Complete the manual assistive-technology checks listed in the accessibility rules.
   Enable **Dependency graph** in [repository security settings](https://github.com/carsonmcrae/wcarsonmcrae/settings/security_analysis)
   and rerun Dependency review; the first PR run reported that the graph is disabled.
2. The remote currently has no `main` branch; its default is `claude/vibrant-heisenberg-ggf3kl`.
   Carson must establish `main` from the reviewed implementation before enabling the main-only Deploy
   workflow. Do not accidentally publish the historical default branch.
3. In this repository's Settings → Pages, choose **GitHub Actions**. Keep the separate
   `carsonmcrae.github.io` portfolio repository and its settings unchanged.
4. Provision reactions using [its guide](../workers/reactions/README.md), after confirming the existing
   Cloudflare account is on the Free plan. Set repository Actions variable `PUBLIC_REACTIONS_URL`
   to its HTTPS origin. Counts gracefully report unavailable without it.
5. Configure `daysforth.com` in GitHub Pages **before** changing DNS. Actions deployments ignore
   `CNAME` files; this repository intentionally has none.
6. Publish the reviewed main branch, configure the records below, then enforce HTTPS when the
   certificate is ready. Configure the legacy-domain redirect after the destination works.

`actions/configure-pages` supplies the deployed origin and project path to Astro. Canonical links,
assets, sitemap, social images, and copy-link actions follow that address. Local builds default to
`https://daysforth.com`; `npm run test:build:subpath` verifies the GitHub project path separately.

## daysforth.com DNS at GoDaddy

Optionally verify ownership first in GitHub profile Settings → Pages using GitHub's TXT challenge.
Retain that TXT record. Preserve MX, TXT, and unrelated records when replacing parking records.

| Type  | Name | Value                   |
| ----- | ---- | ----------------------- |
| A     | @    | `185.199.108.153`       |
| A     | @    | `185.199.109.153`       |
| A     | @    | `185.199.110.153`       |
| A     | @    | `185.199.111.153`       |
| CNAME | www  | `carsonmcrae.github.io` |

Optional IPv6 records are `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
and `2606:50c0:8003::153`. Never use wildcard records. GitHub redirects `www.daysforth.com` to the
configured apex. DNS and certificate issuance can each take up to 24 hours.

## wcarsonmcrae.com forwarding

GitHub Pages accepts one unrelated custom domain per site. In GoDaddy's DNS → Forwarding, add an
unmasked permanent **301** redirect to `https://daysforth.com/` for the domain and its `www` host.
GoDaddy provides HTTPS forwarding. Preserve unrelated email/DNS records. Verify HTTP, HTTPS,
`www`, and representative old deep links. Record whether the registrar preserves paths and queries
rather than promising that behavior in advance.

## Live acceptance checks

- The HTTPS Daysforth apex loads; HTTP and `www` redirect to it.
- Both forms of `wcarsonmcrae.com` reach Daysforth over HTTP and HTTPS.
- `/posts/married-nicole/`, `/brand/`, `/work/`, `/life/`, `/about/`, `/contact/`, and
  `/accessibility/` load directly. Unknown paths show the custom 404.
- Sitemap, robots, canonical tags, and share previews use Daysforth.
- A reaction appears in another browser. Duplicate reactions do not increment twice. Save is local.
- Free plan limits remain enabled; do not enable paid overages or upgrades.

## Rollback

Carson can revert the reviewed commit on `main` to republish the previous build, or unpublish Pages.
Record prior DNS/forwarding values before changing them. Do not delete protected photo originals or
backups during rollback.

## Official references

Checked November 2026; re-check before applying provider settings:

- [GitHub: custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub: troubleshooting domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- [GoDaddy: forwarding](https://www.godaddy.com/en-ca/help/forward-my-godaddy-domain-12123)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
