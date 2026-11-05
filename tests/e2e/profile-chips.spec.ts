/**
 * Purpose: Verify readable profile chips and consistent category metadata on real pages.
 * Scope: Mobile visibility/reflow, both themes, native filter choices, and permanent post metadata.
 * Does NOT belong: Timeline date navigation or gallery interactions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { expectNoViolations, horizontalOverflow } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`profile chips remain visible and wrap at 320 px in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('');
    const profile = page.locator('.profile-summary');
    await expect(profile.locator('.profile-summary__handle')).toHaveText('@carsonmcrae');
    await expect(profile.locator('.profile-summary__handle')).toBeVisible();
    await expect(profile.locator('.profile-summary__location')).toHaveText('Nashville, TN');
    await expect(profile.locator('.profile-summary__location')).toBeVisible();
    for (const name of ['LinkedIn', 'GitHub', 'Product portfolio', 'Contact']) {
      const link = profile.getByRole('link', { name: new RegExp(name) });
      await expect(link).toBeVisible();
      await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(await link.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe(
        'none',
      );
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await horizontalOverflow(page)).toBe(0);
    await expectNoViolations(page);
  });

  test(`category chips and selected filter share icons in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    const samples = { Work: 'infoworks', Projects: 'built-daysforth', Life: 'married-nicole' };
    const glyphs: Record<string, string> = {};
    for (const [category, id] of Object.entries(samples)) {
      const chip = page.locator(`#moment-${id} .post-meta .category-chip`);
      await expect(chip).toHaveText(category);
      await expect(chip.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(
        await chip.evaluate((element) => element.closest('a,button,[role="button"]') !== null),
      ).toBe(false);
      expect(await chip.evaluate((element) => getComputedStyle(element).cursor)).not.toBe(
        'pointer',
      );
      glyphs[category] = (await chip.locator('use').getAttribute('href'))!;
    }
    const summary = page.locator('.timeline-menu summary').first();
    for (const category of Object.keys(samples)) {
      await summary.click();
      const option = page.getByRole('radio', { name: category, exact: true });
      await expect(option.locator('..').locator('use')).toHaveAttribute('href', glyphs[category]!);
      await option.check();
      await expect(page.locator('[data-category-icon] use')).toHaveAttribute(
        'href',
        glyphs[category]!,
      );
    }
    await page.goto('posts/married-nicole/');
    await expect(page.locator('.post-meta .category-chip')).toHaveText('Life');
    await expect(page.locator('.post-meta .category-chip use')).toHaveAttribute(
      'href',
      glyphs['Life']!,
    );
    await expect(page.locator('.post-meta .milestone-label')).toHaveText('Milestone');
    await expect(page.locator('.post-meta > i[aria-hidden="true"]')).toHaveCount(3);
    await expectNoViolations(page);
  });
}

test('a YouTube destination has a local play glyph and preserves its link-only behavior', async ({
  page,
}) => {
  const remoteMedia: string[] = [];
  page.on('request', (request) => {
    if (/youtube\.com|youtu\.be|ytimg\.com/.test(new URL(request.url()).hostname))
      remoteMedia.push(request.url());
  });
  await page.goto('posts/sydney-study-abroad/');
  const link = page.getByRole('link', {
    name: 'Watch my study-abroad video on YouTube',
    exact: false,
  });
  await expect(link.locator('use')).toHaveAttribute('href', /#icon-youtube$/);
  await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAccessibleName(/external site, opens in a new tab/);
  await expect(page.locator('iframe, video')).toHaveCount(0);
  expect(remoteMedia).toEqual([]);
});
