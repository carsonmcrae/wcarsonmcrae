# Daysforth implementation

Daysforth is Carson McRae’s personal website and a working demonstration of a profile that is a
timeline. Its primary address is `https://daysforth.com`. `wcarsonmcrae.com` is the personal-domain
alias. The source remains in `carsonmcrae/wcarsonmcrae`.

## Approved interface

The [approved images](wireframes/approved/README.md) are the visual reference. The centered profile
and pins share the same center as the main feed. Timeline and Posts reuse the same card elements,
so switching mode preserves their action state. Category selection always retains milestones.

The date menu combines month/year navigation with Years, Quarters, and Months detail. Coarser views
group posts into expandable periods. The overview slider continuously previews months and jumps
when its value is committed. The three permanent overview labels belong only to pinned moments.
Scrolling the feed updates the displayed date. View, category, detail, and selected date are encoded
in the URL; Back/Forward restores them.

Every moment has its own `/posts/<id>/` page, true date precision, neighboring moments, and a link
back to its place in the full timeline. Without JavaScript the home page is a complete list grouped
by year. Secondary pages retain Carson’s approved personal-site content in the Daysforth shell.

## Content

All 17 moments have confirmed months. The three pins are November 1999, May 2022, and October 2026.
Carson supplied the remaining months on November 4: PC build December 2015, Vanderbilt August 2018,
InfoWorks June 2021, Booz Allen September 2022, Margot July 2022, and Quinn July 2023.

The more precise app-history dates and the Minetrocity date follow the earlier owner handoff.
Southern Surface Company stays off the site. A month-only event is never assigned a fictional day.

The 17 incoming original photographs were backed up outside the checkout and verified with SHA-256
before pulling. `photos-incoming/` remains ignored and unchanged. Approved, metadata-stripped copies
already existed in `src/assets/photos/`; a separate square crop supplies the profile portrait.

## Brand kit

`/brand/` presents the identity and downloads. `public/brand/daysforth-brand-kit.zip` contains original
outlined SVG logos, PNG variants, app icons, social artwork, the web font, licenses, tokens, and usage
guidance. Run `npm run images:brand` to regenerate all assets and the archive together.

The mark is an original D with three connected moments. The palette is blue, ink, paper, mist, and
slate. Inter matches the compact typography of the approved product direction; Atkinson Hyperlegible
Mono remains in the Life page’s existing org chart.

Font outlining uses the official Inter 4.1 source at
`https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.ttf`, SHA-256
`4989b125924991b90d05b2d16e0e388c48f7d5bb8b30539bbf9c755278d0ccaf`.
The browser font comes from pinned `@fontsource-variable/inter`. Font and icon licenses ship in the kit.

## Reactions and local actions

Save and theme preferences stay in browser storage. Copy link uses the published address. Shared
reaction totals use the [small Worker](../workers/reactions/README.md); the static site stays on
GitHub Pages. An unset or unreachable service shows an unknown total, never an invented count.
Save and Copy continue working while a reaction read is pending or fails.

`PUBLIC_REACTIONS_URL` supplies the public API address at build time. Astro permits only that API’s
origin in `connect-src`. The Worker validates origins and moment IDs, bounds request bodies, hashes
identifiers, prevents duplicate votes in SQL, and rate-limits new reactions. It has no analytics.

## Release

Run `npm run validate:full`, then follow [DEPLOYMENT.md](DEPLOYMENT.md). The repository reserves
merges, deployments, repository/Pages settings, and DNS changes to Carson. Local implementation and
preparation do not imply those release actions have happened.

Automated accessibility results do not replace the required NVDA and VoiceOver evaluation. Record
the actual browser/platform findings in `design-qa.md` and the release review.
