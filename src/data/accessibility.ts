/**
 * Purpose: The public accessibility statement shown at /accessibility/.
 * Scope: The standard the site targets, what has been built and how it is checked, known
 *   limitations, and how to report a problem.
 * Constraints: Keep it honest. Never claim full conformance without the complete evaluation
 *   described in docs/governance/accessibility.md; update `reviewed` when the statement changes.
 * Does NOT belong: The engineering rules themselves (docs/governance/accessibility.md).
 */

export const accessibility = {
  title: 'Accessibility',
  lede: 'This site should work for everyone who visits it, including people who use a screen reader, a keyboard, magnification, or high-contrast settings.',
  reviewed: 'November 2026',
  standard:
    'The goal is to meet the Revised Section 508 standards, using WCAG 2.2 Level AA as the target.',
  practices: [
    'Clear page structure with landmarks, ordered headings, and a skip link',
    'Everything works with a keyboard, with a visible focus indicator',
    'Text and controls meet contrast requirements in both light and dark themes',
    'Pages reflow at narrow widths and at 200% text size without losing content',
    'Motion is minimal and turns off when your system asks for reduced motion',
    'High-contrast (forced colors) modes are supported',
    'Images have text alternatives, and nothing plays automatically',
    'No tracking, analytics, or third-party scripts',
  ],
  testing:
    'Automated accessibility checks run on every page, in both themes, in Chromium and WebKit, every time the site changes, along with keyboard, zoom, and text-spacing checks. Core timeline controls and action feedback were also checked with NVDA on Windows.',
  limitations: ['VoiceOver testing on macOS and iOS hasn’t been completed for this version yet.'],
  feedback:
    'If something doesn’t work for you, please tell me. A message on [LinkedIn](https://www.linkedin.com/in/carsonmcrae/) or an issue on [GitHub](https://github.com/carsonmcrae/wcarsonmcrae/issues) both reach me.',
  colophonTitle: 'About this site',
  colophon: [
    'Daysforth is set in Inter, an open-source typeface chosen for clear, compact interfaces. The org chart on the Life page uses Atkinson Hyperlegible Mono.',
    'It’s built with [Astro](https://astro.build), hosted on GitHub Pages, and has no tracking, analytics, or cookies. The [source is on GitHub](https://github.com/carsonmcrae/wcarsonmcrae).',
    'Saved moments and your theme preference stay in your browser. Shared reactions use an anonymous browser identifier to prevent duplicate votes; the service stores hashed identifiers and publishes only counts.',
  ],
};
