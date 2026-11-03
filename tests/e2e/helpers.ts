/**
 * Purpose: Shared page list and helpers for the browser tests.
 * Scope: The site's pages (paths relative to the base URL, so tests run at the root or under the
 *   GitHub Pages project path), opening the small-screen menu, and an overflow measurement.
 * Does NOT belong: Test cases (the *.spec.ts files beside it).
 */
import type { Page } from '@playwright/test';

export const PAGES = [
  { name: 'Home', path: '' },
  { name: 'About', path: 'about/' },
  { name: 'Work', path: 'work/' },
  { name: 'Life', path: 'life/' },
  { name: 'Contact', path: 'contact/' },
  { name: 'Accessibility', path: 'accessibility/' },
] as const;

export const NAV_PAGES = PAGES.filter((page) =>
  ['About', 'Work', 'Life', 'Contact'].includes(page.name),
);

/** How far the page scrolls sideways (0 means no horizontal overflow). */
export function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/** Opens the small-screen menu when it is collapsed, so navigation links are reachable. */
export async function openMenuIfCollapsed(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Menu' });
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click();
  }
}
