/**
 * Purpose: Verify the profile portrait downloads an image suited to its visible size.
 * Scope: Actual browser candidate selection at mobile/desktop widths and DPR 1/2.
 * Does NOT belong: Other image contexts, portrait styling, or photo-viewer behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';

for (const viewportWidth of [390, 1440]) {
  for (const deviceScaleFactor of [1, 2]) {
    test.describe(`portrait at ${viewportWidth}px and DPR ${deviceScaleFactor}`, () => {
      test.use({ viewport: { width: viewportWidth, height: 900 }, deviceScaleFactor });

      test('selects a small responsive candidate and retains the large native photo link', async ({
        page,
      }, testInfo) => {
        await page.goto('');
        const image = page.locator('.profile-summary__portrait img');
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).toHaveAttribute('sizes', '(max-width: 40rem) 4.5rem, 9rem');
        const selected = await image.evaluate((element: HTMLImageElement) => {
          const candidates = element.srcset.split(',').map((entry) => {
            const [url, width] = entry.trim().split(/\s+/);
            return { url: new URL(url!, document.baseURI).href, width: Number.parseInt(width!) };
          });
          return {
            url: element.currentSrc,
            width: candidates.find((candidate) => candidate.url === element.currentSrc)?.width,
            widths: candidates.map((candidate) => candidate.width),
            visibleWidth: element.getBoundingClientRect().width,
            viewer: element.closest('a')!.href,
          };
        });
        expect(selected.widths).toEqual([160, 320, 600]);
        expect(selected.visibleWidth).toBe(viewportWidth <= 640 ? 72 : 144);
        expect(selected.width).toBe(viewportWidth > 640 && deviceScaleFactor === 2 ? 320 : 160);
        expect(selected.viewer).not.toBe(selected.url);
        const response = await page.request.get(selected.url);
        expect(response.ok()).toBe(true);
        const bytes = (await response.body()).byteLength;
        expect(bytes).toBeGreaterThan(0);
        await testInfo.attach('portrait-image-selection', {
          body: JSON.stringify({ ...selected, bytes, deviceScaleFactor }),
          contentType: 'application/json',
        });
      });
    });
  }
}
