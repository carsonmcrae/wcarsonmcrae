/**
 * Purpose: Verify the requested compact app actions and Life-page polish.
 * Scope: Equal, reachable controls, preserved destinations, disclosure dismissal, and approved copy/icons.
 * Does NOT belong: Whole-site scans, reaction writes, or release publication.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { projects } from '../../src/data/projects';
import { expectNoViolations, horizontalOverflow } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  for (const width of [390, 1280]) {
    test.describe(`${width}px in ${colorScheme}`, () => {
      test.use({ colorScheme, reducedMotion: 'reduce', viewport: { width, height: 900 } });
      test(`Work actions stay consistent and keep every destination at ${width}px in ${colorScheme}`, async ({
        page,
      }) => {
        await page.goto('work/');
        await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
        let referenceWidth = 0;
        for (const project of projects) {
          const card = page.locator(`.project#${project.id}`);
          const visit = card.locator('.project__actions > a');
          const more = card.locator('.project__more > summary');
          await expect(visit).toHaveAttribute('href', project.links[0]!.href);
          await expect(visit).toHaveAttribute('target', '_blank');
          const visitSize = (await visit.boundingBox())!;
          const moreSize = (await more.boundingBox())!;
          expect(visitSize.height).toBeGreaterThanOrEqual(44);
          expect(moreSize.height).toBeGreaterThanOrEqual(44);
          expect(visitSize.width).toBeCloseTo(moreSize.width, 0);
          expect(visitSize.height).toBeCloseTo(moreSize.height, 0);
          if (referenceWidth) expect(visitSize.width).toBeCloseTo(referenceWidth, 0);
          referenceWidth = visitSize.width;
          await more.click();
          for (const link of project.links.slice(1)) {
            const destination = card.locator(`.project__more-panel a[href="${link.href}"]`);
            await expect(destination).toBeVisible();
            await expect(destination).toBeInViewport();
            await expect(destination).toHaveAttribute('target', '_blank');
            await expect(destination).toHaveAttribute('rel', 'noopener noreferrer');
          }
          await page.keyboard.press('Escape');
          await expect(card.locator('.project__more')).not.toHaveAttribute('open', '');
          await expect(more).toBeFocused();
        }
        expect(await horizontalOverflow(page)).toBe(0);
        await expectNoViolations(page);
      });

      test(`Life shows the requested home base and dog glyphs at ${width}px in ${colorScheme}`, async ({
        page,
      }) => {
        await page.goto('life/');
        await expect(page.locator('.now-panel')).toContainText(
          'Nashville: w/ Nicole, Margot, and Quinn',
        );
        const dogs = page.locator('.org__seal use');
        await expect(dogs).toHaveCount(2);
        for (const dog of await dogs.all())
          await expect(dog).toHaveAttribute('href', '/icons.svg#icon-dog');
        expect(await horizontalOverflow(page)).toBe(0);
        await expectNoViolations(page);
      });
    });
  }
}
