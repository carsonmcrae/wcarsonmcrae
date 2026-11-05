/**
 * Purpose: Protect decorative icon rendering when shared-symbol markup is kept compact.
 * Scope: Pixel equivalence with explicit legacy SVG sizing and keyboard exclusion in every browser project.
 * Does NOT belong: Brand artwork or the licensed Phosphor path definitions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

test('shared symbols preserve their rendered appearance without redundant container attributes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.site-header');
  await header.locator('svg.icon').evaluateAll((icons) => {
    for (const icon of icons) {
      icon.setAttribute('viewBox', '0 0 256 256');
      icon.setAttribute('focusable', 'false');
    }
  });
  const explicit = await header.screenshot({ animations: 'disabled' });
  await header.locator('svg.icon').evaluateAll((icons) => {
    for (const icon of icons) {
      icon.removeAttribute('viewBox');
      icon.removeAttribute('focusable');
    }
  });
  const compact = await header.screenshot({ animations: 'disabled' });
  expect(compact).toEqual(explicit);
  const visibleIcons = await header.locator('svg.icon').evaluateAll((icons) =>
    icons
      .filter((icon) => icon.getBoundingClientRect().height > 0)
      .map((icon) => ({
        width: (icon as SVGGraphicsElement).getBBox().width,
        height: (icon as SVGGraphicsElement).getBBox().height,
        tabIndex: (icon as SVGElement).tabIndex,
        hidden: icon.getAttribute('aria-hidden'),
      })),
  );
  expect(visibleIcons.length).toBeGreaterThan(0);
  for (const icon of visibleIcons) {
    expect(icon.width).toBeGreaterThan(0);
    expect(icon.height).toBeGreaterThan(0);
    expect(icon.tabIndex).toBe(-1);
    expect(icon.hidden).toBe('true');
  }
});
