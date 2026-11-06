/**
 * Purpose: Verify feed photography selects a resource suited to its actual rendered slot.
 * Scope: Native lazy selection for photo and screen covers in both views at DPR 1/2.
 * Does NOT belong: Changing cover geometry, image quality, or the large native-link fallback.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { imageSelection, scrollPageTo } from './helpers';

for (const viewportWidth of [390, 1440]) {
  for (const deviceScaleFactor of [1, 2]) {
    test.describe(`feed images at ${viewportWidth}px and DPR ${deviceScaleFactor}`, () => {
      test.use({ viewport: { width: viewportWidth, height: 900 }, deviceScaleFactor });

      for (const view of ['timeline', 'posts']) {
        test(`uses actual photo and screenshot slots in ${view} view`, async ({
          page,
        }, testInfo) => {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.goto(`?view=${view}`);
          await expect(page.locator('[data-timeline]')).toHaveAttribute('data-view', view);
          await page.evaluate(() => document.fonts.ready);
          const selections = [];
          for (const id of ['first-pc', 'recalen-beta']) {
            const image = page.locator(`#moment-${id} .post-media [data-photo] img`);
            await expect(image).toHaveAttribute('loading', 'lazy');
            await expect(image).toHaveAttribute('sizes', 'auto, 95vw');
            const destination = await image.evaluate((element) => {
              const bounds = element.getBoundingClientRect();
              return Math.max(
                0,
                Math.round(scrollY + bounds.top - (innerHeight - bounds.height) / 2),
              );
            });
            if (Math.abs((await page.evaluate(() => scrollY)) - destination) > 1)
              await scrollPageTo(page, destination);
            await expect(image).toBeInViewport();
            await expect
              .poll(async () => {
                const candidate = await image.evaluate(imageSelection);
                const required = candidate.visibleWidth * deviceScaleFactor;
                const expected =
                  candidate.widths.find((width) => width >= required) ?? candidate.widths.at(-1)!;
                return (
                  candidate.complete && candidate.naturalWidth > 0 && candidate.width === expected
                );
              })
              .toBe(true);
            await image.evaluate((element: HTMLImageElement) => element.decode());
            const selected = await image.evaluate(imageSelection);
            const required = selected.visibleWidth * deviceScaleFactor;
            const expected =
              selected.widths.find((width) => width >= required) ?? selected.widths.at(-1)!;
            expect(selected.width, id).toBe(expected);
            expect(selected.viewer, id).not.toBe(selected.url);
            selections.push({ id, ...selected, deviceScaleFactor });
          }
          await testInfo.attach('feed-image-selection', {
            body: JSON.stringify(selections),
            contentType: 'application/json',
          });
        });
      }
    });
  }
}
