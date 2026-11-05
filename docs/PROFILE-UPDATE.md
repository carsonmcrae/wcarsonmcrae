# Profile update — November 4, 2026

## Content and media

The profile now has 24 moments, including ten newly confirmed education, award, work, travel,
and hobby events. Each has a real cover. The three original pinned moments remain unchanged.
The homepage uses William Carson McRae; post authors retain Carson McRae.

Confirmed additions: watch collecting September 2012; Eagle Scout October 2016; FBLA Digital Video
Production first in Tennessee and sixth nationally July 2017; high-school graduation as salutatorian
May 2018; Apple July 2018–May 2022; Sydney study abroad August 2019; YouTube experiment October 2019;
self-built watch December 2024; pickleball May 2026; golf August 2026. InfoWorks ends September 2022.
Sydney’s initially ambiguous year was explicitly corrected to 2019 by Carson.

The watch post identifies the Fossil Men’s Grant Chronograph, Lorier Zephyr, Traska Venturer GMT,
Tissot Le Locle Powermatic 80, Hamilton Murph, and self-built green-dial GMT. Supplied YouTube and
PlanetMinecraft links are ordinary external links; no embedded trackers or autoplay are added.

All 39 incoming originals remain untouched and ignored. Three external backup batches (32, 6, 1)
were SHA-256 verified before processing. The 22 new imported photos were metadata-stripped; the
original 17 had already been processed. Wedding albums use distinct color photos and the friends
photo, with no duplicate black-and-white versions. Dogs use puppy covers and grown-up albums.
The new graduation cover preserves the full subject; the former graduation photo is an album extra.

App covers are actual public interface captures: TTSNative’s reader demo at 20 seconds, Recalen’s
public feed walkthrough image, PicPledge’s public promo at 20 seconds, and the updated local
Daysforth homepage. The Daysforth project uses its approved refined D icon. Brand exports are unchanged.

## Browsing and presentation

All covers link to their permanent posts and carry an expand affordance. Multi-photo events show
their photo count. Images use substantially taller frames and contain rather than crop the subject.
Side-image card actions align to the bottom. Post metadata has explicit dot separators, including
before the milestone chip. Post albums keep full photo proportions and descriptive captions.

The timeline rail sticks with the view/category/date controls, with a nonsticky fallback for short
or heavily enlarged viewports. Milestones filters to milestones alone. Ordinary category filters
retain milestones. Save is functional browser-local storage; the Saved collection now makes saved
moments retrievable. Retired app-start bookmarks migrate once to the matching release moment.

Full posts include a proportional month slider that previews the nearest moment and navigates on
commit. Left/right arrows visit adjacent actual events, including events sharing a month. Earlier
is on the left and Newer on the right, with directional icons. Three old app-start permalinks retain
accessible canonical redirects, while only release/launch/beta events appear in the feed and sitemap.

Work, Life, About, and Contact have new editorial layouts, readable panels, and clearer links.
Work retains Plain English/Engineer-speak. Life photos link to matching events. Footer navigation
has separate Explore and Resources groups. Header navigation has decorative Phosphor icons.

## Reactions and release sequence

Love, Celebrate, Smile, and Applaud are independent shared totals. Heart IDs remain compatible;
new kinds use suffixed keys. DELETE removes only the requesting visitor’s selected reaction.
Existing origin, bounded-body, salted-identity, and rate-limit protections remain. The database
schema does not change. Real reactions must never be reset.

Deploy the updated Worker before publishing the frontend. This update is prepared on
`codex/profile-update-20261104`. The current repository instructions reserve merges and deployment
for Carson. Production DNS, repository settings, and the live Worker are unchanged by this update.

## Verification

Validation results and manual findings are recorded in `design-qa.md` after the final checks.
The initial release’s NVDA results do not cover these new interactions. A fresh NVDA pass and
VoiceOver checks on macOS and iOS remain outstanding; no conformance certification is claimed.
