/**
 * Purpose: Protect decorative icon appearance and native keyboard exclusion as markup evolves.
 * Scope: Fresh-document pixel equivalence with legacy SVG sizing and native keyboard exclusion.
 * Does NOT belong: Brand artwork or the licensed Phosphor path definitions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

async function readyHeader(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.querySelectorAll<HTMLImageElement>('.site-header img')).map((image) =>
        image.decode(),
      ),
    );
  });
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
  return header;
}

test('shared symbols preserve legacy appearance and native keyboard exclusion', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  const sourceUrl = page.url();
  const header = await readyHeader(page);
  // Inspect shipped markup without mutating its rendered SVG instance cache.
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
  const reference = await context.newPage();
  try {
    await reference.emulateMedia({ reducedMotion: 'reduce' });
    let rewritten = 0;
    await reference.route(sourceUrl, async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      const original = '<svg class="icon" aria-hidden="true">';
      rewritten = html.split(original).length - 1;
      // Build the reference before first paint; live viewport changes can alter curve rasters.
      const body = html.replaceAll(
        original,
        '<svg class="icon" aria-hidden="true" viewBox="0 0 256 256" focusable="false">',
      );
      await route.fulfill({ response, body });
    });
    await reference.goto(sourceUrl);
    expect(rewritten, 'Legacy SVG markup was rewritten before parsing').toBeGreaterThan(0);
    const legacyHeader = await readyHeader(reference);
    await expect(legacyHeader.locator('svg.icon').first()).toHaveAttribute(
      'viewBox',
      '0 0 256 256',
    );
    await expect(legacyHeader.locator('svg.icon').first()).toHaveAttribute('focusable', 'false');
    const explicit = await legacyHeader.screenshot({ animations: 'disabled' });
    if (!actual.equals(explicit)) {
      await test.info().attach('explicit-header', { body: explicit, contentType: 'image/png' });
      await test.info().attach('actual-header', { body: actual, contentType: 'image/png' });
    }
    expect(actual.equals(explicit), 'Header PNG bytes remain exactly equal').toBe(true);
  } finally {
    await reference.close();
  }
});
