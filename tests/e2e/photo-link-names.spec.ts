/**
 * Purpose: Preserve descriptive image-link names through storage-dialog and reload lifecycle changes.
 * Scope: Real footer/settings flow, offscreen lazy timeline images, explicit names, and unmodified axe coverage.
 * Does NOT belong: Waiting for image loading, hiding problematic links, or changing the document under test.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { expectNoViolations, openThemedHome } from './helpers';
import { timelinePosts } from '../../src/data/timeline';

const timelinePhotoCount = timelinePosts.reduce(
  (count, post) => count + Number(Boolean(post.image)) + (post.gallery?.length ?? 0),
  0,
);

for (const colorScheme of ['light', 'dark'] as const) {
  test(`offscreen photo links stay descriptively named after settings and reload in ${colorScheme}`, async ({
    page,
  }) => {
    await openThemedHome(page, colorScheme);
    await page.getByRole('button', { name: 'Keep storage off', exact: true }).click();
    const footer = page.locator('.site-footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.getByRole('button', { name: 'Settings for browser storage', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Browser storage', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.reload();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const photos = page.locator('[data-timeline-groups] [data-photo]');
    await expect(photos).toHaveCount(timelinePhotoCount);
    const offscreen = await photos.evaluateAll(
      (links) => links.filter((link) => link.getBoundingClientRect().top >= innerHeight).length,
    );
    expect(offscreen).toBeGreaterThan(0);
    for (const photo of await photos.all()) {
      const image = photo.locator('img');
      const alternative = await image.getAttribute('alt');
      expect(alternative!.trim().length).toBeGreaterThan(0);
      await expect(image).toHaveAttribute('loading', 'lazy');
      await expect(photo).toHaveAttribute('aria-label', alternative!);
      await expect(photo).toHaveAccessibleName(alternative!);
    }
    await expectNoViolations(page);
  });
}
