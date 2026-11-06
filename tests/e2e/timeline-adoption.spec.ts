/**
 * Purpose: Keep native card and disclosure interactions intact when deferred timeline state arrives.
 * Scope: Real scrolling, focus, and pressed summary targets during a held module request.
 * Does NOT belong: Sleeps, synthetic intent dispatch, or weakening command readiness assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test } from './fixtures';
import { scrollPageByKey, scrollPageTo } from './helpers';

async function holdTimelineModule(page: Page) {
  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await page.route('**/timeline-mount.*.js', async (route) => {
    requested.resolve();
    await release.promise;
    await route.continue();
  });
  return { requested: requested.promise, release: release.resolve };
}

test('adopts a focused static card after delayed module delivery without moving its original nodes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const module = await holdTimelineModule(page);
  try {
    await page.goto('');
    const card = page.locator('#moment-vanderbilt-graduation');
    await card.scrollIntoViewIfNeeded();
    await module.requested;
    const original = await card.evaluateHandle((element) => ({
      card: element,
      parent: element.parentElement,
      year: element.closest('.moment-group--year'),
    }));
    const title = card.locator('h3 a');
    await title.focus();
    await scrollPageByKey(page, 'PageDown');
    await expect(title).toBeFocused();
    module.release();
    await expect
      .poll(() =>
        card.evaluate(
          (element) => element.closest<HTMLElement>('.moment-group')!.dataset['period'],
        ),
      )
      .toBe('2022-05');
    await expect(title).toBeFocused();
    expect(
      await original.evaluate(({ card: element, parent, year }) => ({
        connected: element.isConnected,
        sameParent: element.parentElement === parent,
        sameYear: element.closest('.moment-group--year') === year,
      })),
    ).toEqual({ connected: true, sameParent: true, sameYear: true });
    await original.dispose();
  } finally {
    module.release();
  }
});

test.describe('native summaries with reader text enlargement', () => {
  // Reader CSS overrides are the subject of this scenario; the existing card case keeps production CSP.
  test.use({ bypassCSP: true });
  for (const [name, index] of [
    ['category', 0],
    ['date', 1],
  ] as const) {
    test(`preserves native ${name} summary activation when hydration finishes during a press`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const module = await holdTimelineModule(page);
      let pressed = false;
      try {
        await page.goto('');
        await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        await page.evaluate(() => document.fonts.ready);
        const details = page.locator('.timeline-menu').nth(index);
        const summary = details.locator('summary');
        const top = await summary.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return Math.max(0, scrollY + bounds.top - (innerHeight - bounds.height) / 2);
        });
        if ((await page.evaluate(() => scrollY)) !== top) await scrollPageTo(page, top);
        await module.requested;
        const label = summary.locator('[data-category-label], [data-current-date]');
        const original = await label.evaluateHandle((element) => element.firstChild!);
        const bounds = (await summary.boundingBox())!;
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        pressed = true;
        module.release();
        await expect(page.locator('[data-timeline-groups] [data-period]').first()).toBeAttached();
        expect(await label.evaluate((element, text) => element.firstChild === text, original)).toBe(
          true,
        );
        await page.mouse.up();
        pressed = false;
        await expect(details).toHaveJSProperty('open', true);
        await expect(
          details.getByRole(name === 'date' ? 'button' : 'radio', {
            name: name === 'date' ? 'Go to date' : 'All categories',
            exact: true,
          }),
        ).toBeVisible();
        expect(await original.evaluate((text) => text.isConnected)).toBe(true);
        await original.dispose();
      } finally {
        module.release();
        if (pressed) await page.mouse.up();
      }
    });
  }
});
