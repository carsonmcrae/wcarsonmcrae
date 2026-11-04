# Daysforth design and verification review

final result: passed

The implementation and final visual comparisons passed. Owner release checks remain separate.

## Visual truth and captures

The approved source is `docs/wireframes/approved/`: `timeline-desktop.png` and
`posts-desktop.png` (1487 × 1058), `timeline-mobile.png` (853 × 1844), and
`controls-and-menus.png` (1576 × 998). The last is a component diagram rather than a viewport.

Implementation: `http://127.0.0.1:4322/`, with production screenshots captured by Playwright against
its temporary local HTTPS preview. Desktop CSS viewport and captures are 1440 × 1024 at density 1;
mobile captures are 390 × 844 at density 1. Reference images are normalized to those frame sizes
for the combined source-left / implementation-right comparisons. No browser chrome is included.

| State                            | Combined evidence                                                        |
| -------------------------------- | ------------------------------------------------------------------------ |
| Light Timeline, profile and pins | [Desktop comparison](docs/wireframes/qa/desktop-comparison.jpg)          |
| Light Posts, profile and pins    | [Posts comparison](docs/wireframes/qa/posts-comparison.jpg)              |
| Light mobile Timeline            | [Mobile comparison](docs/wireframes/qa/mobile-comparison.jpg)            |
| October photo cards              | [Focused Posts comparison](docs/wireframes/qa/post-cards-comparison.jpg) |
| Consolidated date menu           | [Date menu](docs/wireframes/qa/date-menu-comparison.jpg)                 |
| Date options at 200% text        | [Enlarged menu](docs/wireframes/qa/menu-200.jpg)                         |
| New identity and brand guide     | [Brand guide](docs/wireframes/qa/brand-guide.jpg)                        |

Raw captures are in ignored `screenshots/daysforth-*.png`; the compact review images above are
committed. The October captures verify the scrolled feed separately from the profile overview.

## Content and state differences

These are intentional consequences of the owner's later instructions, not claims of pixel identity:

- Daysforth replaces the rejected Thenroll name and mark. The blue, ink, and white system remains.
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

The complete `npm run validate:full` run passed: 220 unit tests, 100% per-file coverage across
all 37 covered files (899 statements, 460 branches, 186 functions, 822 lines), 207 root build checks,
207 subpath build checks, and 455 browser checks with 19 intentional project/opt-in skips.
The production dependency audit reported zero vulnerabilities. No gate or budget was lowered.

The final full run includes the six-width sweep (320, 375, 390, 768, 1024, 1440), adjacent-card
alignment, nine constrained-menu checks, date-jump heading visibility, and visual captures. The
sweep checks all 24 content pages and verifies that the three rail targets never overlap.

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
- [x] Brand kit: 29-file archive with outlined SVGs, PNGs, app icons, social artwork, font, licenses,
      tokens, and usage guide; 187,307 bytes, within the existing asset cap.
- [x] Final normalized visual comparison, full validation, and focused post-fix checks recorded.
- [ ] Owner accessibility sign-off and remaining copy review.
- [ ] Owner release: establish reviewed `main`, enable Pages, deploy the free Worker/D1 service,
      configure Daysforth, and forward the legacy domain. See `docs/DEPLOYMENT.md`.

The repo's owner-only merge/deployment/settings/DNS rule remains in force. No hosting or DNS
change has occurred during implementation. The separate GitHub portfolio remains unchanged.
