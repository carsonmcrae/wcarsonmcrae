/**
 * Purpose: Keep explicit timeline destinations stable while nearby lazy photographs finish loading.
 * Scope: Real delayed image responses, reserved media geometry, and date-jump viewport position.
 * Does NOT belong: Arbitrary readiness delays or changes to native history restoration.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';

test('a date jump stays on its selected moment as lazy images decode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  await page.locator('html[data-site-ready="true"]').waitFor();
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested: string[] = [];
  await page.route('**/_astro/*.webp', async (route) => {
    requested.push(route.request().url());
    await ready;
    await route.continue();
  });
  await page
    .getByRole('button', { name: 'Go to Vanderbilt graduation, May 2022', exact: true })
    .click();
  const moment = page.locator('#moment-vanderbilt-graduation');
  await expect(moment).toBeInViewport();
  await expect.poll(() => requested.length).toBeGreaterThan(0);
  const initial = (await moment.boundingBox())!.y;
  release();
  const decoded = await page.evaluate(async (urls) => {
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('.post-media [data-photo] img'),
    ).filter((image) => {
      const candidates = [
        image.src,
        ...image.srcset
          .split(',')
          .map((candidate) => new URL(candidate.trim().split(' ')[0]!, document.baseURI).href),
      ];
      return candidates.some((url) => urls.includes(url));
    });
    await Promise.all(images.map((image) => image.decode()));
    return images.length;
  }, requested);
  expect(decoded).toBeGreaterThan(0);
  await expect(moment).toBeInViewport();
  expect((await moment.boundingBox())!.y).toBeCloseTo(initial, 0);
});
