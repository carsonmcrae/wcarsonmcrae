/**
 * Purpose: Verify compact approved albums through complete keyboard, button, and swipe navigation.
 * Scope: All dog/Carson photos, viewer metadata, scroll isolation, focus return, and no-JavaScript links.
 * Does NOT belong: New personal facts or simulated reaction activity.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { carsonGallery, dogGalleries } from '../../src/data/photo-gallery';
import { expectNoViolations } from './helpers';
const albums = [
  ...dogGalleries.map((album) => ({ ...album, path: 'life/' })),
  { id: 'carson-photos', photos: carsonGallery.photos, path: 'about/' },
];
for (const album of albums) {
  test(`${album.id} exposes every photo through its compact native carousel`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(album.path);
    const preview = page.locator(`#${album.id}`);
    await expect(preview.locator('.photo-gallery > li:visible')).toHaveCount(3);
    await expect(preview.locator('figcaption')).toHaveCount(0);
    const entry = preview.locator('.album-preview__action');
    await entry.scrollIntoViewIfNeeded();
    await entry.click();
    const viewer = page.locator('[data-photo-viewer]');
    await expect(viewer).toBeVisible();
    const position = await page.evaluate(() => scrollY);
    await expectNoViolations(page);
    const count = viewer.locator('[data-photo-count]');
    for (const [index, photo] of album.photos.entries()) {
      await expect(count).toHaveText(`Photo ${index + 1} of ${album.photos.length}`);
      await expect(viewer.locator('[data-photo-large]')).toHaveAttribute('alt', photo.alt);
      await expect
        .poll(() =>
          viewer
            .locator('[data-photo-large]')
            .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        )
        .toBe(true);
      await expect(viewer.locator('[data-photo-caption-output]')).toHaveText(photo.caption);
      if (photo.postId)
        await expect(viewer.locator('[data-photo-related]')).toHaveAttribute(
          'href',
          new RegExp(`/posts/${photo.postId}/$`),
        );
      else await expect(viewer.locator('[data-photo-related]')).toBeHidden();
      await viewer.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await expect(count).toHaveText(`Photo 1 of ${album.photos.length}`);
    await viewer.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(count).toHaveText(`Photo ${album.photos.length} of ${album.photos.length}`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(count).toHaveText(`Photo ${album.photos.length} of ${album.photos.length}`);
    await page.keyboard.press('ArrowRight');
    if (isMobile) {
      await viewer.locator('[data-photo-stage]').evaluate((stage) => {
        for (const [type, x] of [
          ['touchstart', 200],
          ['touchend', 40],
        ] as const) {
          const event = new Event(type, { bubbles: true });
          Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
            value: [{ clientX: x, clientY: 100 }],
          });
          stage.dispatchEvent(event);
        }
      });
      await expect(count).toHaveText(`Photo 2 of ${album.photos.length}`);
    }
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('PageDown');
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(entry).toBeFocused();
    const thirdPreview = preview.locator('.photo-gallery > li:visible [data-photo]').nth(2);
    const selectedAlt = await thirdPreview.locator('img').getAttribute('alt');
    await thirdPreview.click();
    await expect(viewer.locator('[data-photo-large]')).toHaveAttribute('alt', selectedAlt!);
    if (album.path === 'life/') {
      await page.keyboard.press('Escape');
      await page.locator(`.dog > .photo [data-photo-album="${album.id}"]`).click();
      await expect(count).toHaveText(`Photo 1 of ${album.photos.length}`);
    }
  });
}
test('without JavaScript every original album photo remains a usable native link', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(new URL('life/', baseURL).href);
  for (const album of dogGalleries) {
    const photos = page.locator(`#${album.id} .photo-gallery [data-photo]`);
    await expect(photos).toHaveCount(8);
    for (const photo of await photos.all()) {
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('href', /(?:\.webp(?:\?|$)|[?&]f=webp(?:&|$))/);
    }
  }
  await context.close();
});
