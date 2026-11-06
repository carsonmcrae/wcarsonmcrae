/**
 * Purpose: Verify useful secondary-page navigation after real, completed scrolling gestures.
 * Scope: Four approved routes, both themes, native pointer/keyboard input, reflow and modal locks.
 * Does NOT belong: Timeline date navigation, synthetic intent events, or relaxed geometry assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';
import { resizePage, scrollPageByKey, scrollPageTo } from './helpers';

test.use({ viewport: { width: 390, height: 664 } });

async function openSecondaryPage(page: Page, route: string) {
  await page.goto(route);
  await page.locator('html[data-site-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return {
    up: page.getByRole('button', { name: 'Top of page', exact: true }),
    down: page.getByRole('button', { name: 'Bottom of page', exact: true }),
  };
}

for (const route of ['work', 'life', 'about', 'contact']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${route} page shortcuts qualify and reach both edges in ${colorScheme}`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      const { up, down } = await openSecondaryPage(page, `${route}/`);
      await expect(up).toBeHidden();
      await expect(down).toBeHidden();
      await scrollPageTo(page, 120);
      await expect(up).toBeHidden();
      await expect(down).toBeHidden();
      await scrollPageByKey(page, 'PageDown');
      await expect(up).toBeVisible();
      const upper = await up.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          top: box.top,
          headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
          visual: Number.parseFloat(getComputedStyle(element, '::before').width),
        };
      });
      expect(upper.width).toBeGreaterThanOrEqual(44);
      expect(upper.height).toBeGreaterThanOrEqual(44);
      expect(upper.visual).toBe(28);
      expect(upper.top).toBeGreaterThanOrEqual(upper.headerBottom);
      await (isMobile ? up.tap() : up.click());
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator('main')).toBeFocused();
      await expect(up).toBeHidden();
      await expect(down).toBeVisible();
      const lower = (await down.boundingBox())!;
      expect(lower.width).toBeGreaterThanOrEqual(44);
      expect(lower.height).toBeGreaterThanOrEqual(44);
      expect(lower.y + lower.height).toBeLessThanOrEqual(664);
      await (isMobile ? down.tap() : down.click());
      await expect(page.locator('footer')).toBeFocused();
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY),
        )
        .toBeLessThanOrEqual(1);
      await expect(down).toBeHidden();
      await expect(up).toBeVisible();
    });
  }
}

test('short pages and viewport resizing never activate shortcuts by themselves', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 5000 });
  await openSecondaryPage(page, 'contact/');
  const controls = page.locator('[data-page-edge]');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
    true,
  );
  for (const control of await controls.all()) await expect(control).toBeHidden();
  await page.keyboard.press('PageDown');
  await resizePage(page, { width: 390, height: 664 });
  for (const control of await controls.all()) await expect(control).toBeHidden();
  await scrollPageByKey(page, 'PageDown');
  await expect(page.getByRole('button', { name: 'Top of page', exact: true })).toBeVisible();
  await resizePage(page, { width: 390, height: 5000 });
  for (const control of await controls.all()) await expect(control).toBeHidden();
});

test('a short scrollable Contact page qualifies at its bottom without requiring a full-page gesture', async ({
  page,
}) => {
  const { up, down } = await openSecondaryPage(page, 'contact/');
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await resizePage(page, { width: 390, height: documentHeight - 90 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight))
    .toBe(90);
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  await scrollPageByKey(page, 'PageDown');
  await expect(up).toBeVisible();
  await expect(down).toBeHidden();
  await up.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(up).toBeHidden();
  await expect(down).toBeVisible();
});

test('native dialogs and the mobile drawer suppress page navigation without losing its qualification', async ({
  page,
}) => {
  const { up, down } = await openSecondaryPage(page, 'about/');
  await scrollPageByKey(page, 'PageDown');
  await expect(up).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const drawer = page.locator('#site-menu');
  await expect(drawer).toBeVisible();
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  const locked = await page.evaluate(() => scrollY);
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => scrollY)).toBe(locked);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(up).toBeVisible();
  await page.locator('footer [data-storage-open]').click();
  const dialog = page.locator('[data-storage-dialog]');
  await expect(dialog).toBeVisible();
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(up).toBeVisible();
});

test('other routes keep their own navigation without secondary-page shortcuts', async ({
  page,
}) => {
  for (const route of ['', 'posts/born/', 'privacy/', 'releases/']) {
    await page.goto(route);
    await expect(page.locator('[data-page-edge]')).toHaveCount(0);
  }
});
