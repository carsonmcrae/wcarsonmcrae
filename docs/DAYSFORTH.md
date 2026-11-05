# Daysforth implementation

Daysforth is Carson McRae’s personal website and a working demonstration of a profile that is a
timeline. Its primary address is `https://wcarsonmcrae.com`. `daysforth.com` forwards to the personal
domain. The source remains in `carsonmcrae/wcarsonmcrae`.

## Approved interface

The [approved images](wireframes/approved/README.md) are the visual reference. The centered profile
and pins share the same center as the main feed. Timeline and Posts reuse the same card elements,
so switching mode preserves their action state. Ordinary categories retain milestones; Milestones
and Saved are dedicated focused collections.

The date menu combines month/year navigation with Years, Quarters, and Months detail. Coarser views
group posts into expandable periods. The overview slider continuously previews months and jumps
when its value is committed. The three permanent overview labels belong only to pinned moments.
Scrolling the feed updates the displayed date. View, category, detail, and selected date are encoded
in the URL; Back/Forward restores them.

Every moment has its own `/posts/<id>/` page, true date precision, neighboring moments, albums, and a link
back to its place in the full timeline. Without JavaScript the home page is a complete list grouped
by year. Secondary pages retain Carson’s approved personal-site content in the Daysforth shell.

## Content

All 24 moments have confirmed months. The three pins are November 1999, May 2022, and October 2026.
Carson supplied the remaining months on November 4: PC build December 2015, Vanderbilt August 2018,
InfoWorks June 2021, Booz Allen September 2022, Margot July 2022, and Quinn July 2023.

The more precise app-history dates and the Minetrocity date follow the earlier owner handoff.
Southern Surface Company stays off the site. A month-only event is never assigned a fictional day.

The 39 incoming original photographs were backed up outside the checkout and verified with SHA-256
before pulling. `photos-incoming/` remains ignored and unchanged. Approved, metadata-stripped copies
already existed in `src/assets/photos/`; a separate square crop supplies the profile portrait.
The [profile update](PROFILE-UPDATE.md) records the added stories, confirmed dates, galleries,
app interface captures, and accessible compatibility redirects for retired app-start events.

## Brand kit

`/brand/` presents the identity and downloads. `public/brand/daysforth-brand-kit.zip` contains original
outlined SVG logos, PNG variants, app icons, social artwork, the web font, licenses, tokens, and usage
guidance. Run `npm run images:brand` to regenerate all assets and the archive together.

The approved refined D uses a connected inset timeline at 32 px and larger. The simplified drawing
uses three separate moments below 32 px and in all browser favicons. Main, reversed, monochrome,
small-size, app-icon, and social exports are generated together from the selected artwork. The
palette stays blue, ink, paper, mist, and slate. Inter and the wordmark are unchanged; Atkinson
Hyperlegible Mono remains in the Life page’s existing org chart.

Font outlining uses the official Inter 4.1 source at
`https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.ttf`, SHA-256
`4989b125924991b90d05b2d16e0e388c48f7d5bb8b30539bbf9c755278d0ccaf`.
The browser font comes from pinned `@fontsource-variable/inter`. Font and icon licenses ship in the kit.

## Reactions and local actions

Save and theme preferences stay in browser storage; the Saved filter retrieves saved moments.
Copy link uses the published address. Love, Celebrate, Smile, and Applaud are independently
toggleable shared reactions. Shared
reaction totals use the [small Worker](../workers/reactions/README.md); the static site stays on
GitHub Pages. An unset or unreachable service shows an unknown total, never an invented count.
Save and Copy continue working while a reaction read is pending or fails.

`PUBLIC_REACTIONS_URL` supplies the public API address at build time. Astro permits only that API’s
origin in `connect-src`. The Worker validates origins and moment IDs, bounds request bodies, hashes
identifiers, prevents duplicate votes in SQL, and rate-limits new reactions. It has no analytics.

## Release

Run `npm run validate:full`, then follow [DEPLOYMENT.md](DEPLOYMENT.md). Carson explicitly authorized
the initial launch, including merges, GitHub Pages, Cloudflare, and domain settings, on November 4, 2026. The current repository instructions reserve subsequent merges and deployment for Carson.
For the profile update, deploy the updated reactions Worker before publishing the frontend.

Automated accessibility results do not replace the required NVDA and VoiceOver evaluation. Record
the actual browser/platform findings in `design-qa.md` and the release review.
