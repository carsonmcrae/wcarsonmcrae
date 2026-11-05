# Privacy review — November 4, 2026

Scope: this free personal portfolio, its GitHub Pages delivery, Cloudflare redirects and reaction
Worker/D1, browser storage, external links, and the features introduced in the polish release.
This is an engineering review of the actual implementation, not a worldwide legal certification.

## Decisions implemented

- No analytics, advertising, tracking pixels, third-party scripts, embedded players, accounts,
  uploads, or application cookies. Fonts, photos, SVG icons, and scripts are served with the site.
- Optional localStorage is off until a deliberate Allow choice. Before permission, theme changes,
  bookmarks, and reaction identifiers use memory for the current document only. They are not
  written to sessionStorage or cookies. The previous passive achievement/visited-pages tracker
  was removed; it had no role in the requested browsing experience.
- An explicit Allow or Keep off decision is retained for 180 days so it can be respected. This
  necessary decision record is separate from optional preferences. Equal choice buttons, withdrawal,
  clearing browser data, and a persistent Storage settings entry are provided.
- Reaction totals are permanent, but identifiers are not. The API retains a salted UUID hash,
  reaction key, and timestamp for deduplication. Hourly cleanup removes records aged 90 days.
  A visitor can erase their identifier earlier without reducing aggregate totals.
- The API receives the network address needed to process a request. It stores an hourly salted
  network hash for rate limiting, not a raw IP. Expired rate buckets are cleaned hourly. Worker
  observability remains disabled. GitHub and Cloudflare still process hosting/security data;
  “no analytics” must not be presented as “no provider ever receives an IP address.”
- Exact return positions use native browser history/BFCache and history.state, without an
  application browsing-history store or service worker. The strict no-referrer policy stays.
- External sites load only after an explicit link click, in a new tab with noopener/noreferrer.
  No automatic YouTube iframe is loaded. An extra consent popup for a normal labelled link would
  not substitute for the destination’s own privacy obligations. Browser controls determine whether
  a new tab opens in the current browser; a website cannot force a different browser application.
- The public notice identifies Carson, the actual choices, hosting providers, international
  processing possibilities, retention, permanent totals, rights requests, and the existing private
  LinkedIn contact channel. No private email or home address was invented or published.

## Official sources and applicability

- [ICO storage/access guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/):
  browser-storage rules extend beyond cookies. The 2026 guidance addresses purpose-specific
  exceptions and consent. We chose default-off optional storage instead of relying on an
  appearance-preference exception. A necessary consent-decision record is kept separately.
  The ICO’s official search-indexed guidance was available; direct pages returned 403 during review.
- [ICO UK GDPR guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/):
  territorial scope and lawful bases depend on establishment, targeting, and monitoring facts.
  Merely being reachable from another country does not resolve applicability. Security and
  deduplication are narrowly limited and disclosed; hashed identifiers are treated as pseudonymous.
- [Tennessee HB1181 / TIPA](https://wapp.capitol.tn.gov/apps/BillInfo/Default?BillNumber=HB1181&ga=113):
  the statutory scope includes revenue and consumer-volume/sale thresholds. This repository is a
  personal, free portfolio without advertising sales. There is no evidence here establishing that
  those commercial thresholds apply; reassess before adding a business, advertising, or accounts.
- [California Privacy Protection Agency FAQ](https://cppa.ca.gov/faq): CCPA coverage depends on a
  for-profit business and statutory thresholds, not simply a Californian visiting a website.
  No sale or advertising sharing is implemented. Do not assert an absolute exemption for future uses.
- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions):
  this general-audience portfolio is not designed for children and does not solicit names, ages,
  contact information, or uploads. Persistent identifiers can still be personal information;
  default-off optional persistence and limited security processing reduce unnecessary collection.
  Reassess if children become an intended audience or there is actual knowledge of collection.
- [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection),
  [GitHub privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement),
  and [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/): disclose provider IP and
  network/security processing. Their policies, international transfers, and retention are not
  controlled by the site. No unverified retention promises about either provider were added.

## Limits and future changes

This review cannot determine every jurisdiction, the owner’s unrelated business facts, or changes
made later in hosting dashboards. A qualified legal review would be needed for a legal opinion.
Reassess before introducing analytics, ad sharing, forms, accounts, uploads, child-directed services,
or commercial targeting in additional jurisdictions. A dedicated approved public privacy email
would improve contact access; only existing approved contact channels are published today.

Verification covers default-off storage/cookies, deliberate allowance, cross-page persistence,
withdrawal, identifier erasure, retention cleanup, unchanged permanent totals, external-link isolation,
and strict CSP. Actual release results belong in design-qa.md.
