/**
 * Purpose: Keeps every date-menu option reachable in constrained reading layouts.
 * Scope: Keyboard focus in short windows and at 200% text size, with reader CSS overrides.
 * Does NOT belong: Main navigation or date/grouping calculations.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';

test.use({ bypassCSP: true });
for (const { width, height, scale } of [
  { width: 320, height: 400, scale: 100 },
  { width: 320, height: 640, scale: 200 },
  { width: 390, height: 844, scale: 200 },
]) {
  test(`date options remain reachable at ${height}px height and ${scale}% text`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    await page.addStyleTag({ content: `html { font-size: ${scale}% !important; }` });
    await page.locator('.timeline-menu summary').nth(1).click();
    await page.getByRole('button', { name: 'Go to date', exact: true }).focus();
    await page.keyboard.press('Tab');
    const months = page.getByRole('radio', { name: 'Months', exact: true });
    await expect(months).toBeFocused();
    if (
      process.env['DAYSFORTH_QA'] === '1' &&
      scale === 200 &&
      testInfo.project.name === 'desktop-chromium'
    ) {
      await page.screenshot({ path: 'screenshots/daysforth-menu-200.png' });
    }
    const overflow = await months.evaluate((input) => {
      const label = input.parentElement!.getBoundingClientRect();
      const panel = input.closest('.timeline-menu__panel')!.getBoundingClientRect();
      return {
        top: Math.max(0, panel.top) - label.top,
        bottom: label.bottom - Math.min(window.innerHeight, panel.bottom),
        left: Math.max(0, panel.left) - label.left,
        right: label.right - Math.min(window.innerWidth, panel.right),
      };
    });
    // One CSS pixel accommodates fractional WebKit border/intersection rounding.
    for (const [edge, pixels] of Object.entries(overflow))
      expect(pixels, edge).toBeLessThanOrEqual(1);
  });
}
