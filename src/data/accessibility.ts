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
    'Automated accessibility checks run on every page, in both themes, in Chromium and WebKit, every time the site changes, along with keyboard, zoom, and text-spacing checks.',
  limitations: [
    'Hand testing with screen readers (VoiceOver and NVDA) hasn’t been completed for this version yet.',
    'Photos of Margot and Quinn haven’t been added yet, so their entries are text only.',
  ],
  feedback:
    'If something doesn’t work for you, please tell me. A message on [LinkedIn](https://www.linkedin.com/in/carsonmcrae/) or an issue on [GitHub](https://github.com/carsonmcrae/wcarsonmcrae/issues) both reach me.',
  colophonTitle: 'About this site',
  colophon: [
    'This site is set in Atkinson Hyperlegible Next, a typeface the Braille Institute designed to stay legible for readers with low vision. That felt right for someone who builds a text-to-speech app. The org chart on the Life page uses its monospaced sibling, Atkinson Hyperlegible Mono.',
    'It’s built with [Astro](https://astro.build), hosted on GitHub Pages, and has no tracking, analytics, or cookies. The [source is on GitHub](https://github.com/carsonmcrae/wcarsonmcrae).',
  ],
};
