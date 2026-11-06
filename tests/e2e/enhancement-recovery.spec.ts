/**
 * Purpose: Verify native recovery when a stale page cannot obtain an optional module.
 * Scope: Real failed chunk requests, scoped navigation fallback, and original image destinations.
 * Does NOT belong: Production failures, synthetic intent events, or relaxing runtime-health checks.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import manifest from '../../package.json' with { type: 'json' };
import { openMenuIfCollapsed } from './helpers';

for (const [name, chunk] of [
  ['shell entry', /\/_astro\/BaseLayout\.[^/]+\.js$/],
  ['shared dependency', /\/_astro\/shell\.[^/]+\.js$/],
] as const) {
  test(`a missing initial ${name} restores native navigation and complete photo links`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(chunk, (route) => route.abort('failed'));
    await page.goto('about/');
    await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
    await expect(page.locator('html')).not.toHaveAttribute('data-site-ready');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('#carson-photos .photo-gallery > li').last()).toBeVisible();
    const life = page
      .locator('.site-header__desktop')
      .getByRole('link', { name: 'Life', exact: true });
    await expect(life).toBeVisible();
    await life.click();
    await expect(page).toHaveURL(/\/life\/$/);
    await expect(page.locator('main h1')).toBeVisible();
  });
}

test('a missing menu chunk exposes native navigation while theme and privacy still work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(/\/_astro\/menu\.[^/]+\.js$/, (route) => route.abort('failed'));
  const warnings: Promise<unknown>[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.args()[1]!.jsonValue());
  });
  await page.goto('about/');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-menu-fallback', '');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  const header = page.locator('.site-header__desktop');
  await expect(header.getByRole('link', { name: 'Life', exact: true })).toBeVisible();
  const toggle = header.getByRole('button', { name: /Dark mode/ });
  const previous = await toggle.getAttribute('aria-pressed');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', String(previous !== 'true'));
  await page.getByRole('button', { name: 'Keep storage off', exact: true }).click();
  await expect(page.locator('[data-storage-notice]')).toBeHidden();
  expect(await Promise.all(warnings)).toContainEqual({
    code: 'DF_ENHANCEMENT_LOAD',
    component: 'menu',
    category: 'load',
    release: manifest.version,
  });
});

test('a missing photo chunk follows the original full image link on the first click', async ({
  page,
}) => {
  await page.route(/\/_astro\/photo-viewer\.[^/]+\.js$/, (route) => route.abort('failed'));
  await page.goto('about/');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  const entry = page.locator('#carson-photos .album-preview__action');
  const destination = await entry.getAttribute('href');
  expect(destination).toBeTruthy();
  await entry.click();
  await page.waitForURL(new URL(destination!, page.url()).href);
  expect(page.url()).toContain('.webp');
});

test('a missing timeline entry keeps the ready shell and restores a readable native feed', async ({
  page,
}) => {
  await page.route(/\/_astro\/TimelineFeed\.[^/]+\.js$/, async (route) => {
    await page.locator('html[data-site-ready="true"]').waitFor();
    await route.abort('failed');
  });
  await page.goto('');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  await expect(page.locator('html')).toHaveAttribute('data-timeline-fallback', '');
  await expect(page.locator('[data-timeline] .timeline-dock')).toBeHidden();
  await expect(page.locator('[data-timeline-groups] .moment-group > h2').first()).toHaveText(
    /^\d{4}$/,
  );
  await page.getByRole('button', { name: 'Keep storage off', exact: true }).click();
  await expect(page.locator('[data-storage-notice]')).toBeHidden();
  await page.locator('[data-timeline-groups] h3 a').first().click();
  await expect(page).toHaveURL(/\/posts\//);
  await expect(page.locator('main h1')).toBeVisible();
});

test('a missing intent-loaded timeline controller restores annual reading while shell controls work', async ({
  page,
}) => {
  const commanded = Promise.withResolvers<void>();
  await page.route(/\/_astro\/timeline-mount\.[^/]+\.js$/, async (route) => {
    await commanded.promise;
    await route.abort('failed');
  });
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-timeline-ready', 'true');
  const cards = page.locator('[data-timeline-groups] .post-card');
  const count = await cards.count();
  try {
    await page.getByRole('button', { name: 'Posts', exact: true }).click();
  } finally {
    commanded.resolve();
  }
  await expect(page.locator('html')).toHaveAttribute('data-timeline-fallback', '');
  await expect(page.locator('[data-timeline] .timeline-dock')).toBeHidden();
  await expect(page.getByRole('heading', { name: '2026', exact: true })).toBeVisible();
  await expect(cards).toHaveCount(count);
  await openMenuIfCollapsed(page);
  const theme = page.getByRole('button', { name: 'Dark mode', exact: true });
  const pressed = await theme.getAttribute('aria-pressed');
  await theme.click();
  await expect(theme).toHaveAttribute('aria-pressed', String(pressed !== 'true'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Keep storage off', exact: true }).click();
  await expect(page.locator('[data-storage-notice]')).toBeHidden();
});
