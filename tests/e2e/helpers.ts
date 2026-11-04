/**
 * Purpose: Shared page list and helpers for the browser tests.
 * Scope: The site's pages (paths relative to the base URL, so tests run at the root or under the
 *   GitHub Pages project path), opening the small-screen menu, and an overflow measurement.
 * Does NOT belong: Test cases (the *.spec.ts files beside it).
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { timelinePosts } from '../../src/data/timeline';

export const CORE_PAGES = [
  { name: 'Home', path: '' },
  { name: 'About', path: 'about/' },
  { name: 'Work', path: 'work/' },
  { name: 'Life', path: 'life/' },
  { name: 'Contact', path: 'contact/' },
  { name: 'Accessibility', path: 'accessibility/' },
] as const;

export const PAGES = [
  ...CORE_PAGES,
  { name: 'Brand kit', path: 'brand/' },
  ...timelinePosts.map((post) => ({ name: post.title, path: `posts/${post.id}/` })),
];

export const NAV_PAGES = CORE_PAGES.filter((page) =>
  ['About', 'Work', 'Life', 'Contact'].includes(page.name),
);

/** Audits actual rendered states against WCAG A/AA rules, without excluding interactive content. */
export async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([]);
}

/** How far the page scrolls sideways (0 means no horizontal overflow). */
export async function horizontalOverflow(page: Page): Promise<number> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) {
    console.info(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('*'))
          .filter(
            (element) =>
              element.getBoundingClientRect().right > document.documentElement.clientWidth,
          )
          .map((element) => ({
            tag: element.tagName,
            class: element.className,
            parent: element.parentElement?.className,
            text: element.textContent?.trim(),
            right: element.getBoundingClientRect().right,
          })),
      ),
    );
  }
  return overflow;
}

/** Opens the small-screen menu when it is collapsed, so navigation links are reachable. */
export async function openMenuIfCollapsed(page: Page): Promise<void> {
  await page.locator('html[data-site-ready="true"]').waitFor();
  const toggle = page.getByRole('button', { name: 'Menu' });
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click();
  }
}
