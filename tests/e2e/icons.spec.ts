/**
 * Purpose: Protect decorative icon appearance and native keyboard exclusion as markup evolves.
 * Scope: Pixel equivalence with explicit legacy SVG sizing and keyboard exclusion in every browser project.
 * Does NOT belong: Brand artwork or the licensed Phosphor path definitions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

test('shared symbols preserve legacy appearance and native keyboard exclusion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.site-header');
  // External SVG symbols can finish painting after the document and its fonts are ready.
  // A reference captured before real glyph geometry exists compares two different loading states.
  await expect
    .poll(() =>
      header.locator('svg.icon').evaluateAll((icons) => {
        const visible = icons.filter((icon) => icon.getBoundingClientRect().height > 0);
        return (
          visible.length > 0 &&
          visible.every((icon) => {
            const box = (icon as SVGGraphicsElement).getBBox();
            return box.width > 0 && box.height > 0;
          })
        );
      }),
    )
    .toBe(true);
  // Inspect the shipped markup before adding legacy attributes to construct the reference.
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
  const actual = await header.screenshot({ animations: 'disabled' });
  await header.locator('svg.icon').evaluateAll((icons) => {
    for (const icon of icons) {
      icon.setAttribute('viewBox', '0 0 256 256');
      icon.setAttribute('focusable', 'false');
    }
  });
  const explicit = await header.screenshot({ animations: 'disabled' });
  if (!actual.equals(explicit)) {
    await test.info().attach('explicit-header', { body: explicit, contentType: 'image/png' });
    await test.info().attach('actual-header', { body: actual, contentType: 'image/png' });
  }
  expect(actual.equals(explicit), 'Header PNG bytes remain exactly equal').toBe(true);
});
