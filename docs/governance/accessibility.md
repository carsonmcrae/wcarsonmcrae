# Accessibility is a release requirement

Every page, component, and interaction on this site must meet applicable **Revised Section 508**
requirements, with **WCAG 2.2 Level AA** as the working target. The
[Access Board's ICT standards](https://www.access-board.gov/ict/) incorporate WCAG 2.0 A and AA;
[Section508.gov](https://www.section508.gov/develop/applicability-conformance/) explains applicability,
and [WCAG 2.2](https://www.w3.org/TR/WCAG22/) extends the web criteria.

## Build requirements

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one descriptive `h1`, headings in order, and
  native links and buttons. Decorative images and icons are hidden from assistive technology;
  meaningful images have useful alternatives, and illustrations say they are illustrations.
- Everything works with a keyboard. A working skip link comes first, focus is always visible and never
  obscured, there are no positive `tabindex` values, and focus is never trapped. Navigation links carry
  `tabindex="0"` so Safari includes them in the normal tab order.
- Every page has a stable URL that supports direct links, refresh, back, and forward, and a unique,
  descriptive title.
- Text contrast is at least 4.5:1 (3:1 for large text). Control boundaries, state indicators, and focus
  indicators are at least 3:1. Check both themes. Never convey meaning by color alone.
- Text reflows at 320 CSS pixels and survives 200% text size and the WCAG text-spacing overrides
  without clipping or horizontal scrolling. Zoom is never disabled.
- Standalone controls have 44 by 44 CSS-pixel targets; links inside sentences are exempt.
- Hover styles live inside `@media (hover: hover)` so a tap never leaves one behind.
- Respect `prefers-reduced-motion`, `forced-colors`, and the system theme. The theme control has a
  visible label and announces its state (`aria-pressed`).
- Notices are announced politely, dismiss after eight seconds, pause while hovered or focused, and can
  be dismissed by hand.
- External links say so to screen readers. Nothing auto-plays.

## Required verification

1. `npm run validate:full`: axe (WCAG 2.0, 2.1, and 2.2 A/AA rules) on every page in both themes on
   desktop Chromium, mobile Chromium, and mobile WebKit, plus keyboard, skip-link, reflow, text-size,
   text-spacing, target-size, reduced-motion, forced-colors, and no-JavaScript checks
   (`tests/e2e/accessibility.spec.ts`).
2. Before a release that changes layout or interaction, check by hand with a keyboard alone, with
   VoiceOver on Safari (macOS and iOS), and with NVDA on Windows. Record the platform, browser,
   assistive technology, findings, and fixes in the pull request.
3. Keep the public [accessibility statement](../../src/data/accessibility.ts) accurate.

Automated results and code coverage do **not** certify Section 508 conformance. Do not claim full
conformance without the complete evaluation, and record any check that has not been done.
