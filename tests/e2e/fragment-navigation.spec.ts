/**
 * Purpose: Keep explicit section destinations visible beneath the sticky header.
 * Scope: Fresh household, gallery, and policy fragments at desktop and mobile viewport sizes.
 * Does NOT belong: Timeline date navigation or browser-owned Back/Forward restoration.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

for (const [name, destination, target] of [
  ['household', 'life/#household-chart-title', '#household-chart-title'],
  ['hobby gallery', 'life/#photos', '#photos-title'],
  ['privacy section', 'privacy/#browser-storage', '#browser-storage-title'],
] as const) {
  test(`a fresh ${name} destination keeps its heading clear of the sticky header`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('about/');
    await page.goto(destination);
    const heading = page.locator(target);
    await page.locator('html[data-site-ready="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expect(heading).toBeInViewport();
    const header = (await page.locator('.site-header').boundingBox())!;
    const anchor = (await heading.boundingBox())!;
    expect(anchor.y).toBeGreaterThanOrEqual(header.y + header.height);
  });
}
