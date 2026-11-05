# Daysforth design and verification review

final result: passed

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
Both Cloudflare zones are active and validate with DNSSEC. The primary remains DNS-only for GitHub's
automatic certificate checks and renewal; Cloudflare serves the Daysforth redirect and reaction API.
The prepared optional primary-domain edge-header transform does not apply to DNS-only traffic.
This is the pre-publication provisioning checkpoint; see release PR #1 for final live acceptance.
