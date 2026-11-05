/**
 * Purpose: Preserve balanced hobby photography while larger personal albums use their own layout.
 * Scope: Real desktop/mobile tile geometry and retained larger-viewer/destination links on Life.
 * Does NOT belong: Photo approval, navigation behavior, or inferred personal facts.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { lifePhotos } from '../../src/data/photo-gallery';

test('Life hobby photos form desktop pairs and a single mobile column', async ({
  page,
  isMobile,
}) => {
  await page.goto('life/');
  const gallery = page.locator('#photos .photo-gallery');
  const tiles = gallery.locator(':scope > li');
  await expect(tiles).toHaveCount(4);
  const rectangles = await tiles.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().toJSON()),
  );
  if (isMobile) {
    for (const [index, rectangle] of rectangles.entries()) {
      expect(rectangle.x).toBeCloseTo(rectangles[0]!.x, 0);
      expect(rectangle.width).toBeCloseTo(rectangles[0]!.width, 0);
      if (index > 0) expect(rectangle.y).toBeGreaterThan(rectangles[index - 1]!.y);
    }
  } else {
    expect(rectangles[0]!.y).toBeCloseTo(rectangles[1]!.y, 0);
    expect(rectangles[2]!.y).toBeCloseTo(rectangles[3]!.y, 0);
    expect(rectangles[2]!.y).toBeGreaterThan(rectangles[0]!.y);
    expect(rectangles[0]!.x).toBeCloseTo(rectangles[2]!.x, 0);
    expect(rectangles[1]!.x).toBeCloseTo(rectangles[3]!.x, 0);
    expect(rectangles[1]!.x).toBeGreaterThan(rectangles[0]!.x);
  }
  for (const photo of lifePhotos) {
    const tile = tiles.filter({ has: page.locator(`[data-moment-image="${photo.name}"]`) });
    await expect(tile.locator('[data-photo]')).toHaveAttribute(
      'href',
      /(?:\.webp(?:\?|$)|[?&]f=webp(?:&|$))/,
    );
    await expect(tile.locator('.destination-link')).toHaveAttribute(
      'href',
      new RegExp(`/posts/${photo.postId}/$`),
    );
  }
  await expect(gallery.locator('[data-moment-image="first-watch-new-photo"]')).toBeVisible();
});
