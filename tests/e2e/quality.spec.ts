/**
 * Purpose: Browser checks for layout and runtime health across viewports.
 * Scope: No horizontal overflow at 320, 375, 390, 768, 1024, and 1440 px; no console errors, page
 *   errors, or failed requests; the explain-it toggle; and the achievement notice after visiting
 *   every page. Saves full-page screenshots for review when SCREENSHOTS=1.
 * Does NOT belong: Accessibility audits (accessibility.spec.ts) or navigation (navigation.spec.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { horizontalOverflow, PAGES, CORE_PAGES } from './helpers';

const WIDTHS = [320, 375, 390, 768, 1024, 1440];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width} px`, async ({ page }, testInfo) => {
      // Sweep widths once in the resizable desktop engine; mobile engines audit native viewports.
      test.skip(testInfo.project.name !== 'desktop-chromium', 'Viewport sweep runs once.');
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const { name, path } of PAGES) {
        await page.goto(path);
        expect(await horizontalOverflow(page), `${name} at ${width}px`).toBeLessThanOrEqual(0);
        if (path === '') {
          await page.evaluate(() => document.fonts.ready);
          const labels = await page.locator('.date-rail__label').evaluateAll((elements) =>
            elements.map((element) => {
              const { left, right, top, bottom } = element.getBoundingClientRect();
              return { left, right, top, bottom };
            }),
          );
          for (const [index, first] of labels.entries()) {
            for (const second of labels.slice(index + 1)) {
              const overlap =
                Math.min(first.right, second.right) > Math.max(first.left, second.left) &&
                Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top);
              expect(overlap, `Pinned date targets at ${width}px`).toBe(false);
            }
          }
        }
        if (process.env['SCREENSHOTS'] === '1') {
          for (const scheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
            await page.screenshot({
              path: `screenshots/${width}-${name.toLowerCase()}-${scheme}.png`,
              fullPage: true,
            });
          }
        }
      }
    });
  }
});

test('pages load without console errors or failed requests', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`request: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('missing-page')) {
      problems.push(`${response.status()}: ${response.url()}`);
    }
  });
  for (const { path } of PAGES) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(problems).toEqual([]);
});

test('the explain-it toggle switches between plain English and engineer-speak', async ({
  page,
}) => {
  await page.goto('work/');
  const plain = page.getByRole('radio', { name: 'Plain English' });
  const technical = page.getByRole('radio', { name: 'Engineer-speak' });
  await expect(plain).toBeChecked();
  await expect(page.getByText('cross-team dependency management', { exact: false })).toBeHidden();
  await technical.check();
  await expect(page.getByText('cross-team dependency management', { exact: false })).toBeVisible();
  await plain.check();
  await expect(page.getByText('cross-team dependency management', { exact: false })).toBeHidden();
});

test('browsing does not create optional storage or cookies without permission', async ({
  page,
}) => {
  for (const { path } of CORE_PAGES) {
    await page.goto(path);
    await page.locator('html[data-site-ready="true"]').waitFor();
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  }
  expect(await page.context().cookies()).toEqual([]);
});
