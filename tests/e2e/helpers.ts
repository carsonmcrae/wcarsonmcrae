/**
 * Purpose: Shared page list and helpers for the browser tests.
 * Scope: The site's pages (paths relative to the base URL, so tests run at the root or under the
 *   GitHub Pages project path), themed home readiness, native keyboard gesture completion,
 *   menu/shortcut fixtures, and overflow.
 * Does NOT belong: Test cases (the *.spec.ts files beside it).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { timelinePosts } from '../../src/data/timeline';
import { releases } from '../../src/data/releases';

export const CORE_PAGES = [
  { name: 'Home', path: '' },
  { name: 'About', path: 'about/' },
  { name: 'Work', path: 'work/' },
  { name: 'Life', path: 'life/' },
  { name: 'Contact', path: 'contact/' },
  { name: 'Accessibility', path: 'accessibility/' },
  { name: 'Privacy', path: 'privacy/' },
  { name: 'Releases', path: 'releases/' },
] as const;

export const PAGES = [
  ...CORE_PAGES,
  { name: 'Brand kit', path: 'brand/' },
  ...releases.map((release) => ({
    name: `Release ${release.version}`,
    path: `releases/${release.version}/`,
  })),
  ...timelinePosts.map((post) => ({ name: post.title, path: `posts/${post.id}/` })),
];

export const NAV_PAGES = CORE_PAGES.filter((page) =>
  ['About', 'Work', 'Life', 'Contact'].includes(page.name),
);

/** Opens the home page with deterministic theme/motion preferences and initialized site controls. */
export async function openThemedHome(page: Page, colorScheme: 'light' | 'dark'): Promise<void> {
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
}

/** Audits actual rendered states against WCAG A/AA rules, without excluding interactive content. */
export async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => `${node.target.join(' ')} ${node.failureSummary}`).join(', ')}`,
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
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click();
  }
}

/** Named shortcut targets shared by intent, geometry, and touch browser checks. */
export function timelineShortcuts(page: Page) {
  return {
    up: page.getByRole('button', { name: 'Top of timeline, newest moment' }),
    down: page.getByRole('button', { name: 'Bottom of timeline, oldest moment' }),
  };
}

/** Qualifies shortcuts with a completed native PageDown before the next independent gesture. */
export async function qualifyTimelineShortcuts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const controls = timelineShortcuts(page);
  await expect(controls.up).toBeHidden();
  await expect(controls.down).toBeHidden();
  await Promise.all([
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          document.addEventListener('scrollend', () => resolve(), { once: true }),
        ),
    ),
    page.keyboard.press('PageDown'),
  ]);
  await expect(controls.up).toBeVisible();
  await expect(controls.down).toBeVisible();
  return controls;
}

/** An explicit allowed decision for tests of optional persistence; privacy tests use the real UI. */
export async function allowStorage(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'daysforth.consent.v1',
      JSON.stringify({ allowed: true, expires: Date.now() + 86400000 }),
    ),
  );
}
