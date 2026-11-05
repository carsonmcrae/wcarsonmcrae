/**
 * Purpose: Keeps adjacent photographic Posts cards visually aligned.
 * Scope: Different caption lengths preserve common heading and action baselines on desktop.
 * Does NOT belong: Content calculations or one-column mobile card layout.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

test('adjacent Posts cards share heading and action baselines', async ({ page, isMobile }) => {
  // Compare columns only where they exist; mobile intentionally renders a single stacked column.
  test.skip(isMobile, 'Mobile intentionally stacks these cards.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('?view=posts&date=2026-10');
  await expect(page.locator('[data-timeline]')).toHaveAttribute('data-view', 'posts');
  await page.evaluate(() => document.fonts.ready);
  for (const selector of ['h3', '.post-actions']) {
    const difference = await page.evaluate((part) => {
      const first = document.querySelector(`#moment-ttsnative-1 ${part}`)!.getBoundingClientRect();
      const second = document
        .querySelector(`#moment-picpledge-wedding ${part}`)!
        .getBoundingClientRect();
      return Math.abs(first.y - second.y);
    }, selector);
    expect(difference, selector).toBeLessThanOrEqual(1);
  }
});
