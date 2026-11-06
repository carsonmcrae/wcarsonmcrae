/**
 * Purpose: Browser verification of the approved Daysforth timeline journey.
 * Scope: Pinned navigation, native slider, view/filter/date history, saved posts, and visual captures.
 * Does NOT belong: Pure date calculations or backend contracts (tests/unit).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { allowStorage, expectNoViolations } from './helpers';

test.beforeEach(async ({ page }) => {
  await allowStorage(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Posts and open browsing menus pass accessibility checks in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Posts', exact: true }).click();
    await expectNoViolations(page);
    await page.locator('.timeline-menu summary').nth(0).click();
    await expectNoViolations(page);
    await page.keyboard.press('Escape');
    await page.locator('.timeline-menu summary').nth(1).click();
    await expectNoViolations(page);
  });
}

test('the rail labels only pinned dates and supports keyboard date jumps', async ({ page }) => {
  const labels = page.locator('.date-rail__label');
  await expect(labels).toHaveCount(3);
  await expect(labels.nth(0)).toHaveAccessibleName(/Go to Born, Nov(?:ember)? 1999/);
  await expect(labels.nth(1)).toHaveAccessibleName(
    /^Go to Vanderbilt graduation, May 2022(?:\s+05\/22)?$/,
  );
  await expect(labels.nth(2)).toHaveAccessibleName(/Go to Married Nicole, Oct(?:ober)? 2026/);
  await expect(page.getByText('Drag to explore', { exact: true })).toHaveCount(0);
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press('Home');
  await expect(slider).toHaveAttribute('aria-valuetext', 'November 1999');
  await expect(page).toHaveURL(/date=1999-11/);
  await expect(page.locator('#moment-born')).toBeInViewport();
  await labels.nth(1).click();
  await expect(page.locator('#moment-vanderbilt-graduation')).toBeInViewport();
  const heading = page.getByRole('heading', { name: 'May 2022', exact: true });
  const toolbar = page.locator('.timeline-toolbar');
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await toolbar.boundingBox())!.height,
  );
});

test('view, categories, and date detail persist through refresh and history', async ({ page }) => {
  await page.getByRole('button', { name: 'Posts', exact: true }).click();
  await expect(page).toHaveURL(/view=posts/);
  await page.locator('.timeline-menu summary').nth(0).click();
  await page.getByRole('radio', { name: 'Projects', exact: true }).check();
  await expect(page.locator('#moment-joined-booz-allen')).toHaveCount(0);
  await expect(page.locator('#moment-born')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Posts', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-category-label]')).toHaveText('Projects');
  await page.locator('.timeline-menu summary').nth(1).click();
  await page.getByRole('radio', { name: 'Years', exact: true }).check();
  await expect(page.locator('[data-timeline]')).toHaveAttribute('data-detail', 'years');
  await expect(page.locator('.moment-group details')).not.toHaveCount(0);
  await page.goBack();
  await expect(page.locator('[data-timeline]')).toHaveAttribute('data-detail', 'months');
});

test('empty dates offer a nearest moment without discarding the selected month', async ({
  page,
}) => {
  await page.locator('.timeline-menu summary').nth(1).click();
  await page.getByRole('combobox', { name: 'Month', exact: true }).selectOption('06');
  await page.getByRole('combobox', { name: 'Year', exact: true }).selectOption('2005');
  await expect(page.getByRole('combobox', { name: 'Month', exact: true })).toHaveValue('06');
  await expect(page.getByRole('combobox', { name: 'Year', exact: true })).toHaveValue('2005');
  await page.getByRole('button', { name: 'Go to date', exact: true }).click();
  const empty = page.locator('[data-timeline-empty]');
  await expect(empty).toContainText('No moments in June 2005.');
  await expect(page).toHaveURL(/date=2005-06/);
  await empty.getByRole('link').click();
  await expect(empty).toBeHidden();
  await page.goBack();
  await expect(empty).toContainText('No moments in June 2005.');
});

test('Save stays in sync across views, refresh, and the permanent post page', async ({ page }) => {
  const save = page.getByRole('button', { name: 'Save Built Daysforth', exact: true });
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Posts', exact: true }).click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#moment-built-daysforth h3 a').click();
  await expect(page.locator('h1')).toHaveText('Built Daysforth');
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'false');
});

test('captures the approved states for visual review', async ({ page }, testInfo) => {
  // Capture artifacts only on explicit request; the ordinary layout/accessibility cases always run.
  test.skip(
    process.env['DAYSFORTH_QA'] !== '1' || testInfo.project.name !== 'desktop-chromium',
    'Opt-in visual evidence.',
  );
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'William Carson McRae', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.screenshot({ path: 'screenshots/daysforth-desktop-timeline.png' });
  await page.getByRole('button', { name: 'Posts', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'screenshots/daysforth-desktop-posts.png' });
  await page.locator('.timeline-menu summary').nth(1).click();
  await page.screenshot({ path: 'screenshots/daysforth-desktop-controls.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await page
    .getByRole('button', { name: 'Go to Married Nicole, October 2026', exact: true })
    .click();
  await page.screenshot({ path: 'screenshots/daysforth-october-timeline.png' });
  await page.getByRole('button', { name: 'Posts', exact: true }).click();
  await page.screenshot({ path: 'screenshots/daysforth-october-posts.png' });
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.screenshot({ path: 'screenshots/daysforth-dark.png' });
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.goto('');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/daysforth-mobile.png' });
  await page.goto('brand/');
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.screenshot({ path: 'screenshots/daysforth-brand.png', fullPage: true });
});
