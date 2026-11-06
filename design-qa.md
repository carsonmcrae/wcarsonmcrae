# Daysforth design and verification review

Initial release result: passed. The subsequent profile update is recorded at the end of this file.

The implementation and final visual comparisons passed. Carson authorized the agent to complete
publication and infrastructure on November 4; live release checks are recorded below.

## Visual truth and captures

The approved source is `docs/wireframes/approved/`: `timeline-desktop.png` and
`posts-desktop.png` (1487 × 1058), `timeline-mobile.png` (853 × 1844), and
`controls-and-menus.png` (1576 × 998). The last is a component diagram rather than a viewport.

Implementation: `http://127.0.0.1:4322/`, with production screenshots captured by Playwright against
its temporary local HTTPS preview. Desktop CSS viewport and captures are 1440 × 1024 at density 1;
mobile captures are 390 × 844 at density 1. Reference images are normalized to those frame sizes
for the combined source-left / implementation-right comparisons. No browser chrome is included.

| State                             | Combined evidence                                                        |
| --------------------------------- | ------------------------------------------------------------------------ |
| Light Timeline, profile and pins  | [Desktop comparison](docs/wireframes/qa/desktop-comparison.jpg)          |
| Light Posts, profile and pins     | [Posts comparison](docs/wireframes/qa/posts-comparison.jpg)              |
| Light mobile Timeline             | [Mobile comparison](docs/wireframes/qa/mobile-comparison.jpg)            |
| October photo cards               | [Focused Posts comparison](docs/wireframes/qa/post-cards-comparison.jpg) |
| Consolidated date menu            | [Date menu](docs/wireframes/qa/date-menu-comparison.jpg)                 |
| Date options at 200% text         | [Enlarged menu](docs/wireframes/qa/menu-200.jpg)                         |
| New identity and brand guide      | [Brand guide](docs/wireframes/qa/brand-guide.jpg)                        |
| Approved refined D and small mark | [Logo comparison](docs/wireframes/qa/logo-comparison.jpg)                |

Raw captures are in ignored `screenshots/daysforth-*.png`; the compact review images above are
committed. The October captures verify the scrolled feed separately from the profile overview.

## Content and state differences

These are intentional consequences of the owner's later instructions, not claims of pixel identity:

- Daysforth replaces the rejected Thenroll name and mark. The blue, ink, and white system remains.
- Carson subsequently approved the refined filled D and the simplified three-moment drawing in
  `docs/wireframes/approved/logo-refinement.png`. The approved SVGs are archived beside it. The
  existing palette, wordmark, typography, voice, and layout remain unchanged.
- Carson's approved real photographs replace generated illustrative people. Real project icons
  replace the illustrative waveform and group photo in the project cards.
- The November 2026 Daysforth moment precedes October. The reference starts in October; therefore
  above-the-fold post content differs. The focused October comparison checks the matching cards.
- The drag hint is removed. Only the three pinned dates label the rail. Month/year precision follows
  the confirmed dates; no optional day is invented.
- Standalone controls have 44 px targets, and the theme toggle has a visible label. These take more
  space than some controls in the raster reference. Enlarged text can wrap controls onto more lines.
- Metadata, headings, captions, and actions have the extra spacing requested after wireframe approval.

## Findings and comparison history

All P0/P1/P2 items identified in this review are resolved in the implementation below.

| Finding                                                                             | Fix and post-fix evidence                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2: profile after-hours text wrapped because its column was fractionally too narrow | Reduced the portrait/text gap to 24 px and aligned their tops. Desktop comparison shows the intended two-line biography.                                                       |
| P2: inline pin titles inherited an oversized parent line box                        | Made pin titles block elements with their own line height. Mobile comparison checks the two-line graduation label.                                                             |
| P2: mobile overview had excessive empty vertical space                              | Matched the compact header/profile spacing and removed unused rail padding. Mobile comparison retains room for native touch targets.                                           |
| P2: date labels overflowed on tablets and with enlarged text                        | Anchored end labels inside the rail and allowed constrained mobile labels to wrap. Reflow tests retain 320 px, 200% text, and WCAG spacing assertions.                         |
| P2: abbreviated dates did not match accessible names                                | Accessible names now use the visible full/short date text, with hidden action context. Both-theme mobile axe checks pass.                                                      |
| P2: Posts presentation needed the approved photographic hierarchy                   | Image first, title before supporting metadata, wide milestone, two supporting columns, and inline desktop milestone actions. Focused October evidence checks this arrangement. |
| P1: date jumps could hide headings beneath the sticky toolbar                       | Added scroll margins to headings, moments, and empty states for both toolbar heights. Browser assertions compare the target heading with the toolbar bounds.                   |
| P1: scrolling could replace unfinished date-picker values                           | Suspend scroll synchronization while the date menu is open. Actual mobile WebKit date selection and unit regression checks preserve the selected month/year.                   |
| P1: a transient hidden toast was not reliably announced by NVDA                     | Added an always-mounted atomic status region separate from the visual notice. NVDA Speech Viewer subsequently announced “Removed from saved moments.”                          |
| P2: a footer link fell fractionally below 44 px                                     | Added explicit minimum widths. The unchanged target-size gate now passes.                                                                                                      |

## Required fidelity surfaces

The final focused comparison also found P2 drift between adjacent project-card titles/actions when
captions had different lengths. Fixed image/copy/action grid tracks preserve their baselines. A
desktop regression checks both headings and actions; the final October evidence checks the fix.
At 768 px the end-anchored October label touched May. The middle label now moves below the rail at
the same breakpoint as end anchoring. The width sweep checks every pair of pinned date targets for
overlap, in addition to the existing page-overflow checks.
The short-window check exposed offscreen date-detail choices. Menu panels constrain their height
and scroll; short windows release the sticky toolbar, and narrow or enlarged-text containers place
panels in the document flow. Date fields and whole-word detail choices stack when necessary.
Nine keyboard checks cover 320 × 400, 320 × 640 with 200% text, and 390 × 844 with 200% text across
all three browser projects. Normal mobile widths retain the approved two-row toolbar; the date-jump
checks also verify that its height does not obscure the destination heading.

The first Linux CI run found repeated dark-palette declarations. Each light/dark color pair now has
one declaration, with `color-scheme` selecting system or saved preference. This preserves the exact
palette. The Windows duplicate scan had received backslash-expanded configuration paths and scanned
zero files; passing relative scan roots fixes that gap. The same zero-duplication threshold now
checks 155 files locally, including the Worker entry, and finds zero clones.
Registering the link color as a CSS color resolves it before SVG inheritance. The final desktop,
mobile, and dark-mode captures are pixel-identical to the captures before this palette extraction.

- **Typography:** Inter Variable supplies the closest practical sans-serif match to the raster target.
  Name, section headings, compact post titles, and supporting text retain distinct weights and sizes.
  Pin captions use explicit line boxes; post metadata and captions remain separate. Font loading,
  enlarged text, and spacing are checked without truncating the story.
- **Layout and spacing:** centered 800 px profile/pins, 928 px feed, three photographic pins,
  proportional rail, compact two-menu toolbar, thin axis, and rounded post surfaces follow the source.
  Mobile uses one feed column and a two-row toolbar. Native target sizes account for documented
  density differences. Focused card evidence checks hierarchy beyond the overview screenshot.
- **Colors:** white canvas, ink typography, fine blue-grey rules, and restrained blue selection map
  to the source. The new brand uses #1746ff. Slate dark surfaces and lighter blue retain contrast.
  Both themes and open menus are included in automated accessibility checks.
- **Imagery and icons:** all 17 owner-approved photos are placed on matching timeline or secondary
  content. The profile uses a separate square crop. Responsive WebP/AVIF exports meet unchanged
  image budgets. Phosphor supplies UI icons; the Daysforth identity is original vector artwork from
  the separately requested brand-kit work, not a substitute for a source illustration.
- **Copy and content:** approved profile copy, pin titles, category names, and consolidated labels
  are retained. Confirmed month/year dates are used throughout. No drag hint, invented day, fake
  reaction total, private email, or old gaming-profile link is added.

## Functional verification

The browser suite checks both views, all categories with persistent milestones, years/quarters/months,
pins, native slider keyboard input, date jumps and empty months, Back/Forward, refresh persistence,
Save across views and permalinks, and direct routes. Every post has a permanent page. The no-JavaScript
fallback is a complete year-grouped list. Network/console checks cover all pages.

The shared-reaction service is verified using the actual SQLite migration: idempotent votes,
concurrent writes, counts, origin/method/body validation, rate limits, privacy hashing, and failures.
It is prepared locally; it is not deployed. The static app reports unavailable counts honestly.
Wrangler 4.151.3 also bundled the Worker successfully in a deployment dry run: 11.27 KiB,
3.92 KiB gzipped. No remote resource or deployment was created.

The latest complete `npm run validate:full` run passed: 222 unit tests, 100% per-file coverage across
all 37 covered files (904 statements, 465 branches, 186 functions, 826 lines), 207 root build checks,
207 subpath build checks, and 458 browser checks with 19 intentional project/opt-in skips.
The production dependency audit reported zero vulnerabilities. No gate or budget was lowered.
After resolving the inherited link color, `npm run validate` passed again, followed by ten focused
theme/capture checks across the three projects (two intentional capture skips). Those checks verify
that icon colors follow link labels after theme switching, as well as saved/system preferences.

The final full run includes the six-width sweep (320, 375, 390, 768, 1024, 1440), adjacent-card
alignment, nine constrained-menu checks, date-jump heading visibility, and visual captures. The
sweep checks all 24 content pages and verifies that the three rail targets never overlap.

## Approved logo update

The main mark is the exact selected refined D, with a connected inset timeline. The simplified
version uses three separate moments below 32 px and in browser favicons. High-resolution favicon
PNGs use the simplified drawing because their browser-tab placement is small; app icons, the
32 px header, horizontal/stacked lockups, and social artwork use the full timeline.

Both generated SVGs render pixel-identically to the approved references. The exported 16 px favicon
also matches the approved optical drawing. The brand guide shows the 16/24 px examples at their
actual CSS sizes; browser checks verify those dimensions and retrieve the real 37-file ZIP in all
three projects. The archive is 198,142 bytes, within the unchanged 256 KB cap. Monochrome and reversed
exports, usage guidance, download labels, and the complete ZIP were regenerated together.

The app and brand page were visually checked in both themes. The updated comparison images and
[logo proof](docs/wireframes/qa/logo-comparison.jpg) retain the approved geometry and existing layout.
Native ZIP downloads completed in Chromium during the focused checks. Windows WebKit did not emit
a native download event in the loopback HTTPS environment; this is not claimed as native Safari
verification. The archive URL, contents, logo dimensions, and accessibility checks passed in all
three browser projects. Include the native file download in the remaining manual Safari review.

## Manual accessibility review — November 4, 2026

Platform: Windows, Chromium embedded in Codex, NVDA **2026.2** (file version 2026.2.0.57664).
Speech Viewer was inspected visually because NVDA runs at a higher Windows integrity level than the
computer-control helper. The owner opened its viewer; testing then continued against the actual app.

Observed announcements included landmarks, h2 date headings and h3 post titles, image alternatives,
month-valued slider feedback, Posts pressed state, category selection/count feedback, Save pressed
and unpressed state, and the corrected saved-moment live announcement. The notice fix follows
[WAI technique ARIA22](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22).

Keyboard interactions and visible focus were also checked in the browser and automated suite.
Native-window automation resets focus between some inputs, so this is a scoped NVDA spot check,
not an exhaustive uninterrupted screen-reader navigation audit.

**Still required before release/accessibility sign-off:** VoiceOver in Safari on macOS and iOS.
Those platforms have not been claimed as completed. Automated WebKit is not a substitute for
VoiceOver. The public statement records the Windows NVDA check and retains the VoiceOver limitation.
The scoped checks above do not establish full Section 508 or WCAG conformance.

## Release status and checklist

- [x] Latest original branch pulled; work isolated on `codex/daysforth`.
- [x] All 17 incoming originals backed up externally and SHA-256 verified before pulling.
- [x] Brand kit: 37-file archive with both approved mark drawings, SVGs, PNGs, app icons, social
      artwork, font, licenses, tokens, and usage guide; 198,142 bytes, within the existing asset cap.
- [x] Final normalized visual comparison, full validation, and focused post-fix checks recorded.
- [ ] Owner accessibility sign-off and remaining copy review.
- [x] Carson enabled Dependency graph; the rerun of Dependency review passed.
- [x] Reviewed `main` established and protected; Pages and shared reactions configured; signed DNS
      and Daysforth forwarding verified. Final live frontend acceptance is recorded in
      [release PR #1](https://github.com/carsonmcrae/wcarsonmcrae/pull/1).

The standing owner-only release rule is overridden by Carson's explicit authorization for this
release. The separate GitHub portfolio remains unchanged.

## Release hardening — November 4, 2026

The canonical default is now `https://wcarsonmcrae.com`. URL validation rejects unsupported protocols
and credentials; the public API URL also rejects queries/fragments. POST requires an approved
browser Origin. Worker responses include nosniff, denied framing, a deny-all document CSP, and
no-referrer. Version previews and request logging are disabled. SQL deletion maintains totals,
allowing exact canary cleanup without affecting real reactions.

Full local validation passed: **227 unit tests, 100% per-file coverage across 37 files, 207 root and
207 subpath build checks, 458 browser checks passed with 19 intentional skips, and zero production
dependency vulnerabilities**. No threshold, gate, or asset cap was lowered.

The Free Worker and D1 are deployed in the verified account. Verified HTTPS integration returned all
17 totals, persisted a test vote, kept a duplicate at one, and rejected missing/unapproved Origins
with 403. A finally-block cleanup deleted only the exact canary hash; SQL verified no canary remained
and the affected total returned to zero. No fake engagement was retained.

Pages is configured for GitHub Actions with the primary custom domain and public reactions URL.
Both Cloudflare zones are active and validate with DNSSEC. The canonical apex remains DNS-only for
GitHub's automatic certificate checks and renewal. Cloudflare serves the Daysforth redirect,
the primary's www-to-apex redirect, and the reaction API. Its active free Universal certificate
handles www independently of GitHub's cached alternate-host eligibility check.
The prepared optional primary-domain edge-header transform does not apply to DNS-only traffic.
This is the pre-publication provisioning checkpoint; see release PR #1 for final live acceptance.

## Profile update — November 4, 2026

Implementation is ready for owner review on `codex/profile-update-20261104`; it is not published.
The current AGENTS.md reserves merging and deployment for Carson. The live Worker, DNS, Pages
settings, and repository settings were not changed for this update. Deploy the updated Worker
before publishing the frontend; no database migration or reaction reset is required.

The [update record](docs/PROFILE-UPDATE.md) maps the content, photo, interaction, and page-design
changes. All 24 moments have covers, including the May 2018 salutatorian milestone. Wedding,
dogs, watches, graduation, Eagle Scout, and FBLA posts have distinct additional photos. The 39
approved incoming originals remain unchanged in their three verified external backup batches.

Validation completed with **243 unit tests, 100% per-file coverage across 46 files, 287 root and
287 subpath build checks, 578 browser checks passed and 19 intentional skips**, plus zero production
dependency vulnerabilities. The browser run includes desktop Chromium, mobile Chromium, and mobile
WebKit; every current page is checked in both themes, with reflow, text enlargement/spacing, forced
colors, keyboard, target-size, and no-JavaScript checks. The skips are existing platform-specific
desktop responsive checks and non-desktop screenshot captures. No gate or budget was lowered.
The initial sandbox attempt could not start OpenSSL; the authorized run outside the sandbox passed.

The homepage HTML stays below the existing 80 KiB cap by sharing licensed SVG symbols and one
optional-action template. Stories, dates, covers, albums, and permalinks remain server-rendered.
The final singular-status wording was followed by a fresh `npm run validate` and focused browser
verification. The Worker dry run bundled successfully with Wrangler 4.151.3 under the intended
daysforth profile: 20.56 KiB uncompressed / 6.39 KiB gzip. This did not deploy or contact D1 for writes.

Manual review on Windows in the in-app Chromium browser covered all four secondary-page openings,
the high-school and wedding posts, post metadata, PC-card action alignment, full-subject covers,
sticky rail/date alignment, milestone filtering, saving/retrieving/removing a moment, and keyboard
Home/arrow navigation. The temporary saved bookmark was removed through the UI. Automated visual
captures were inspected for desktop dark mode and mobile light mode. One manual finding was fixed:
the scroll observer now reads below the sticky dock rather than choosing a partly obscured group.

Evidence remains ignored under `screenshots/`, including `high-school-milestone.jpg`,
`daysforth-mobile.png`, `daysforth-dark.png`, and the validation logs. The local preview is
`http://127.0.0.1:4322/`.

Fresh NVDA testing of the new post browser, reactions, and Saved collection was not performed;
NVDA was left off after Carson’s TTS request. VoiceOver on macOS/iOS remains unavailable on this
Windows machine. The public statement explicitly records both limitations. The prior NVDA results
above apply only to the initial release; automated checks do not certify Section 508 conformance.

## November 4 polish release

The complete request is mapped in [POLISH-UPDATE.md](docs/POLISH-UPDATE.md), with the scoped legal
and provider review in [PRIVACY-REVIEW.md](docs/PRIVACY-REVIEW.md). Carson explicitly authorized
completion, merge, and production deployment while he was unavailable.

`PW_WEBKIT=1 npm run validate:full` passed locally:

- 266 unit tests; 100% statements, branches, functions, and lines in all 53 covered files.
- 295 built-site checks at the domain root and 295 under the project subpath. HTML, script, CSS,
  font, and image budgets are unchanged. SVG sprite references and external/new-tab link notices
  are checked against the actual build, including the no-JavaScript output.
- 616 browser checks passed across desktop Chromium, mobile Chromium, and mobile WebKit. The 23
  conditional skips cover desktop-only/mobile-only layouts, unsupported mobile WebKit resizing,
  and opt-in screenshots; there are no disabled regression checks or accessibility-rule exclusions.
- Static checks, zero-warning lint/type checks, duplication/unused checks, and production dependency
  audit passed. The existing 429-line secondary stylesheet remains below the 500-line limit.

Regression checks cover permanent selected reactions, opt-in persistence, live withdrawal without
losing filtered-out cards, modal photos and focus return, the mobile drawer and scrim, actual
desktop range dragging, empty-date guidance, quick jumps, native Back/Forward and exact position
restoration, reciprocal watch links, external/footer isolation, and media-frame/overlay alignment.
Both themes, 320px reflow, 200% text, WCAG spacing, forced colors, and no-JavaScript routes are covered.

Manual computer-use review examined the desktop graduation card and sticky date rail, opened a
graduation photograph in the larger viewer, and inspected the 390px mobile drawer and date controls.
The subject remains visible, the desktop frame aligns right, overlays are small, navigation has
icons, and the mobile drawer uses the requested left panel and blue backdrop. Updated production
screenshots and final live acceptance are attached to the release PR after publication.

Findings resolved during verification included overlapping mobile date hit areas, duplicate slider
change handling, a scroll observer replacing explicit date choices, narrow-header overflow at 200%
text, obscured jump headings, and cached-page history availability. Changing view from the profile
now preserves that position; deep browsing preserves the selected period. Storage changes update
the existing cards rather than rebuilding a controller from only the currently filtered subset.

Migration 0002 was applied and Worker version `27bdc096-110d-45ef-a2a3-2b6d15f9016d` was deployed
before the frontend. The live canary proved an idempotent increment, rejected decrement, and
identifier erasure without losing its aggregate. Only that synthetic increment was then removed;
all five real reactions were preserved. CORS, request bounds, and security headers passed live checks.
Final PR/Pages identifiers and frontend live outcomes belong in the release PR evidence.

CI exposed a small return-position shift. Recorded positions now take precedence over date jumps;
fresh restores wait for font layout and own restoration, and the feed disables scroll anchoring.
New date entries do not inherit an earlier entry’s captured position. Cached returns refresh saves
and counts without resetting cards or scroll. Twelve repeated exact-position checks passed across
desktop Chromium, mobile Chromium, and mobile WebKit; the strict assertion remains unchanged.

CI’s secret scanner classified the literal `daysforth.consent.v1` storage name as a generic API key.
It grants no access and is shipped publicly in the browser code. An anchored exact-value exception
documents that non-secret; default scanning remains enabled and no source path is excluded.

NVDA remains off at Carson’s request. Fresh NVDA and VoiceOver review of these new controls is
outstanding and disclosed publicly. This evidence does not establish complete accessibility
conformance or provide a worldwide legal certification.

## Daysforth 1.0.0 — November 5, 2026

The [implementation record](docs/V1-RELEASE.md) maps this release’s request. The approved mobile
drawer now carries the full identity and a quiet storage action. Timeline shortcuts occupy separated
upper/lower positions; desktop navigation is independently centered. Standalone photo destinations
use restrained chips, and the footer keeps its destinations visible in compact wrapping rows.

Life retains its primary dog cards with breed details, adds seven-photo albums for each dog and a
custom semantic household diagram, and preserves the four hobby photos as larger desktop pairs.
About retains its portrait and adds eight photographs. The new horizontal Fossil photo is used on
Life. All 60 incoming originals remain ignored and untouched; the 21 new originals were verified
again against their separate external SHA-256 backup manifest.

Media frames follow the actual image, placing overlays at its upper-right edge. Build-time image
metadata reserves exact frame proportions and separate usable photo/post targets before loading,
including mobile WebKit. Late image responses do not move a selected moment. Media layout now has a
single stylesheet owner; obsolete competing 15rem card columns and redundant post-link metadata
were removed. Both homepage builds remain inside the unchanged 80 KiB HTML cap. The narrow headroom
and the content-growth trigger are recorded in the architecture review.

Manual Windows/in-app Chromium review covered the mobile logo/drawer/storage control, desktop and
mobile household diagrams, dog and About albums, horizontal hobby photography, the compact footer,
privacy/release page readability, timeline shortcuts, and the native photo/storage dialogs. Scrolling
with a photo open left the background at the same recorded position; closing returned focus.
Keyboard Enter opened storage controls and Escape returned focus to their trigger. Browser tests
cover the same behavior in desktop Chromium, mobile Chromium, and mobile WebKit, including native
fragment destinations, image bounds, unloaded targets, reflow, and the footer’s visible/accessibility
name agreement.

The architecture review checked responsibilities and a 72-module runtime graph (74 internal edges,
no cycles). New dependency-boundary and complexity rules protect the actual findings without adding
a framework or splitting cohesive controllers merely for size. The full executable unit scope
maintains 100% per-file coverage; final counts are recorded in the release PR. Maintained architecture, release, security,
ownership, and contribution rules accompany the code; no coverage/duplication exclusions or relaxed
budgets were introduced. The Worker stays public, while secrets and database contents remain private.

Carson explicitly authorized merge, the Worker-first release, publication, repository protection,
and the 1.0.0 tag. Final CI/scanner results, deployment identifiers, preserved reaction totals, and
published-page acceptance evidence are attached to the release pull request. The versioned visitor
notes describe capabilities rather than implementation history.

Index-only migration 0003 was applied before the frontend. Worker version
`930d9eca-c148-41e7-8d7d-6684ba6f5f06` passed live header/rejection checks, and D1’s read-only query
plan uses the visitor index. No synthetic votes were created or removed; all seven real reactions
were preserved. The salt, existing deduplication identities, bindings, and hourly schedule remain.

Fresh NVDA evaluation remains outstanding because Carson requested TTS stay off. VoiceOver on
macOS/iOS is unavailable on this Windows machine. Automated WebKit/axe results and source scans do
not establish full accessibility conformance or certify the absence of every possible vulnerability.

## Daysforth 1.0.1 — November 5, 2026

The complete [follow-up implementation](docs/V1.0.1-RELEASE.md) and
[visual/interaction review](docs/qa/1.0.1.md) are maintained separately so this historical record
stays an index rather than absorbing every release’s detailed evidence. Final publication and
scanner identifiers belong in the release pull request.

## Daysforth 1.1.1 — November 5, 2026

The [focused visual and interaction record](docs/qa/1.1.1.md) covers mobile identity alignment,
secondary-page shortcuts, app explanations and the Recalen cover. The separate
[architecture audit](docs/architecture/audit-1.1.1.md) records corrected state/lifecycle defects,
measured performance improvements and justified follow-up triggers. Protected CI and publication
receipts belong in the release pull request; neither document predeclares those outcomes.
