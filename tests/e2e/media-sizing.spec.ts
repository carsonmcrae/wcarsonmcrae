/**
 * Purpose: Reserve usable screenshot covers before offscreen lazy images load.
 * Scope: Initial target geometry, preserved proportions, image-bound overlays, and related post destinations.
 * Does NOT belong: Image-loading delays, visual exclusions, or post content.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';

test('offscreen screenshot covers have usable targets before loading and keep their overlays on the image', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  const covers = page.locator('.post-media--screen [data-photo]');
  const initial = await covers.evaluateAll((elements) =>
    elements.map((element) => {
      const image = element.querySelector('img')!;
      const bounds = image.getBoundingClientRect();
      const overlay = element
        .parentElement!.querySelector('.post-media__open')!
        .getBoundingClientRect();
      return {
        photo: image.alt,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        aspect: (bounds.width - 2) / (bounds.height - 2),
        expectedAspect: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
        photoAreaWidth: overlay.left - bounds.left,
      };
    }),
  );
  expect(initial.length).toBeGreaterThan(0);
  for (const cover of initial) {
    expect(cover.width, cover.photo).toBeGreaterThanOrEqual(44);
    expect(cover.height, cover.photo).toBeGreaterThanOrEqual(44);
    expect(cover.photoAreaWidth, cover.photo).toBeGreaterThanOrEqual(44);
    expect(cover.aspect, cover.photo).toBeCloseTo(cover.expectedAspect, 1);
  }
  for (const cover of await covers.all()) {
    await cover.scrollIntoViewIfNeeded();
    const geometry = await cover.evaluate((element) => {
      const image = element.querySelector('img')!;
      const bounds = image.getBoundingClientRect();
      const overlay = element
        .parentElement!.querySelector('.post-media__open')!
        .getBoundingClientRect();
      return {
        aspect: (bounds.width - 2) / (bounds.height - 2),
        expectedAspect: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
        top: overlay.top - bounds.top,
        right: bounds.right - overlay.right,
      };
    });
    expect(geometry.aspect).toBeCloseTo(geometry.expectedAspect, 1);
    expect(geometry.top).toBeCloseTo(-18, 0);
    expect(geometry.right).toBeCloseTo(-18, 0);
  }
  const first = covers.first();
  const post = await first.evaluate((element) =>
    element.parentElement!.querySelector('.post-media__open')!.getAttribute('href'),
  );
  await first.click({ position: { x: 20, y: 20 } });
  const viewer = page.locator('[data-photo-viewer]');
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('[data-photo-related]')).toHaveAttribute('href', post!);
});
