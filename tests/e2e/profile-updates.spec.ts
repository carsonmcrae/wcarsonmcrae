/**
 * Purpose: Verify the expanded profile as a complete browsing experience.
 * Scope: Saved/milestone collections, linked albums, event scrubbing, real app covers, and sticky controls.
 * Does NOT belong: Backend SQL guarantees or copying visual implementation into assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';
import { allowStorage, expectNoViolations } from './helpers';
import { timelinePosts } from '../../src/data/timeline';

const wedding = timelinePosts.find((post) => post.id === 'married-nicole')!;

async function holdFirstSaveCommand(page: Page) {
  const requested = Promise.withResolvers<void>();
  const response = Promise.withResolvers<void>();
  await page.route(/\/post-action-events\.[^/]+\.js$/, async (route) => {
    requested.resolve();
    await response.promise;
    await route.continue();
  });
  await allowStorage(page);
  await page.goto('');
  await expect(page.locator('[data-timeline-status]')).toContainText(
    `${timelinePosts.length} moments.`,
  );
  const save = page.getByRole('button', { name: 'Save Built Daysforth', exact: true });
  await save.click();
  await requested.promise;
  return { save, release: () => response.resolve() };
}

test('Saved is useful after refresh and updates immediately when the last item is removed', async ({
  page,
}) => {
  await allowStorage(page);
  await page.goto('');
  await expect(page.locator('h1')).toHaveText('William Carson McRae');
  const save = page.getByRole('button', { name: 'Save Built Daysforth', exact: true });
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.timeline-menu summary').nth(0).click();
  await page.getByRole('radio', { name: 'Saved', exact: true }).check();
  await expect(page.locator('[data-moment]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-moment]')).toHaveCount(1);
  await save.click();
  await expect(page.locator('[data-timeline-empty]')).toHaveText(
    'No saved moments in this browser yet.',
  );
  await page.locator('.timeline-menu summary').nth(0).click();
  await page.getByRole('radio', { name: 'Milestones', exact: true }).check();
  await expect(page.locator('[data-moment]')).toHaveCount(6);
  await expect(page.locator('#moment-high-school-graduation')).toContainText(
    'High school salutatorian',
  );
});

for (const filterBeforeCompletion of [false, true]) {
  test(`pending first Save ${filterBeforeCompletion ? 'survives an empty Saved filter' : 'preserves a newly opened category menu'}`, async ({
    page,
  }) => {
    const pending = await holdFirstSaveCommand(page);
    try {
      await page.locator('.timeline-menu summary').first().click();
      const saved = page.getByRole('radio', { name: 'Saved', exact: true });
      await expect(saved).toBeVisible();
      if (filterBeforeCompletion) {
        await saved.check();
        await expect(page.locator('[data-timeline-empty]')).toHaveText(
          'No saved moments in this browser yet.',
        );
        await expect(pending.save).toHaveCount(0);
      } else await expect(pending.save).toHaveAttribute('aria-pressed', 'false');
      pending.release();
      if (!filterBeforeCompletion) {
        await expect(pending.save).toHaveAttribute('aria-pressed', 'true');
        await expect(saved).toBeVisible();
        await saved.check();
      }
      await expect(page.locator('[data-moment]')).toHaveCount(1);
      await expect(page.locator('#moment-built-daysforth')).toBeVisible();
      await expect(pending.save).toHaveAttribute('aria-pressed', 'true');
      expect(
        await page.evaluate(() => localStorage.getItem('daysforth.saved.built-daysforth')),
      ).toBe('true');
    } finally {
      pending.release();
    }
  });
}

test('a cover opens its distinct album and the post slider visits other post pages', async ({
  page,
}) => {
  await page.goto('');
  const cover = page.locator('#moment-married-nicole .post-media__open');
  await expect(cover).toHaveAccessibleName('View post: Married Nicole');
  // Card focus reveals the intentionally quiet overlay and exercises its keyboard entry.
  await cover.focus();
  await cover.press('Enter');
  await expect(page.locator('h1')).toHaveText('Married Nicole');
  await expect(page.locator('.post-album img')).toHaveCount(wedding.gallery!.length);
  await expect(page.locator('.post-meta > i')).toHaveCount(3);
  const neighbors = page.locator('.post-neighbors a');
  await expect(neighbors.nth(0)).toContainText('Earlier moment');
  await expect(neighbors.nth(1)).toContainText('Newer moment');
  const slider = page.getByRole('slider', { name: 'Browse timeline moments' });
  await expect(slider).toBeEnabled();
  await slider.press('ArrowRight');
  await expect(page.locator('h1')).toHaveText('Built Daysforth');
  await expect(slider).toBeEnabled();
  await slider.press('ArrowLeft');
  await expect(page.locator('h1')).toHaveText('Married Nicole');
});

test('all covers open posts and app events show real interfaces with app icons', async ({
  page,
}) => {
  await page.goto('');
  await expect(page.locator('[data-moment] .post-media')).toHaveCount(24);
  for (const id of ['ttsnative-1', 'recalen-beta', 'picpledge-wedding', 'built-daysforth']) {
    const cover = page.locator(`#moment-${id} .post-media--screen`);
    await expect(cover.locator('.post-media__open')).toHaveAttribute(
      'href',
      new RegExp(`/posts/${id}/$`),
    );
    await expect(cover.locator('.post-media__app img')).toHaveAttribute('alt', '');
  }
  await page.goto('posts/high-school-graduation/');
  await expect(page.locator('main')).toContainText('salutatorian');
});

test('the date rail remains with the browsing controls while scrolling', async ({ page }) => {
  await page.goto('?date=2015-12');
  await expect(page.locator('#moment-first-pc')).toBeInViewport();
  await expect(page.locator('[data-current-date]')).toHaveText('December 2015');
  await page
    .getByRole('button', { name: /^Go to Vanderbilt graduation, May 2022(?:\s+05\/22)?$/ })
    .click();
  const rail = await page.locator('.date-rail').boundingBox();
  const controls = await page.locator('.timeline-toolbar').boundingBox();
  expect(rail!.y).toBeGreaterThanOrEqual(0);
  expect(controls!.y).toBeGreaterThan(rail!.y);
  expect(controls!.y + controls!.height).toBeLessThan(page.viewportSize()!.height);
});

test('new albums and shared reactions remain accessible in both themes', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('posts/watch-collecting/');
    await expect(page.locator('.post-album figure')).toHaveCount(5);
    await expect(
      page.getByRole('group', { name: 'Reactions to The first watch of many' }).getByRole('button'),
    ).toHaveCount(4);
    await expectNoViolations(page);
  }
});
