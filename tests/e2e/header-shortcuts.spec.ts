/**
 * Purpose: Verify fluid header edges and useful, restrained timeline shortcuts.
 * Scope: Independent navigation centering, text/viewport reflow, native dock clearance, and touch intent.
 * Does NOT belong: Photo viewer layout or timeline history/filter ownership.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { qualifyTimelineShortcuts, timelineShortcuts } from './helpers';

test('the broad header aligns with the footer and centers navigation independently', async ({
  page,
}) => {
  await page.goto('');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1280, 1440, 1920, 1088, 960]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const bounds = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect();
      const header = bounds('.site-header__inner');
      const footer = bounds('.site-footer');
      const identity = bounds('.site-header__identity');
      const nav = bounds('.site-header__desktop .primary-nav');
      const theme = bounds('.site-header__desktop .theme-toggle');
      return {
        left: header.left,
        right: header.right,
        footerLeft: footer.left,
        footerRight: footer.right,
        identityLeft: identity.left,
        identityRight: identity.right,
        center: nav.left + nav.width / 2,
        navLeft: nav.left,
        navRight: nav.right,
        themeLeft: theme.left,
        themeRight: theme.right,
        viewportCenter: document.documentElement.clientWidth / 2,
      };
    });
    expect(geometry.left).toBeCloseTo(geometry.footerLeft, 0);
    expect(geometry.right).toBeCloseTo(geometry.footerRight, 0);
    expect(geometry.identityLeft).toBeCloseTo(geometry.left, 0);
    expect(geometry.themeRight).toBeCloseTo(geometry.right, 0);
    expect(geometry.center).toBeCloseTo(geometry.viewportCenter, 0);
    expect(geometry.identityRight).toBeLessThanOrEqual(geometry.navLeft);
    expect(geometry.navRight).toBeLessThanOrEqual(geometry.themeLeft);
    await expect(page.locator('.site-header__desktop .primary-nav a')).toHaveCount(5);
    await expect(page.locator('.site-header__desktop .primary-nav')).toBeVisible();
  }
});

test('header destinations reflow through the drawer and an enlarged-text layout closes on expansion', async ({
  page,
}) => {
  await page.goto('');
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
  const drawer = page.locator('#site-menu');
  for (const width of [880, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(drawer.locator('.primary-nav a')).toHaveCount(5);
    for (const link of await drawer.locator('.primary-nav a').all())
      await expect(link).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(drawer).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '100%';
  });
  await expect(drawer).toBeHidden();
  await expect(toggle).toBeHidden();
  await expect(page.locator('.site-header__desktop .primary-nav')).toBeVisible();
});

test('shortcut circles stay small beside the feed while full targets clear the actual dock', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 740 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('?date=2022-05');
    const { up } = await qualifyTimelineShortcuts(page);
    const geometry = await up.evaluate((element) => {
      const top = element.getBoundingClientRect();
      const bottom = document
        .querySelector('[data-timeline-edge="oldest"]')!
        .getBoundingClientRect();
      const dock = document.querySelector('.timeline-dock')!.getBoundingClientRect();
      const header = document.querySelector('.site-header')!.getBoundingClientRect();
      const feed = document.querySelector('[data-timeline]')!.getBoundingClientRect();
      const circle = getComputedStyle(element, '::before');
      return {
        width: top.width,
        height: top.height,
        top: top.top,
        readingTop: Math.max(0, header.bottom, dock.bottom),
        bottom: bottom.bottom,
        lowerTop: bottom.top,
        left: top.left,
        right: top.right,
        feedRight: feed.right,
        circleWidth: Number.parseFloat(circle.width),
        circleHeight: Number.parseFloat(circle.height),
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: innerHeight,
      };
    });
    expect(geometry.width).toBe(44);
    expect(geometry.height).toBe(44);
    expect(geometry.circleWidth).toBe(28);
    expect(geometry.circleHeight).toBe(28);
    expect(geometry.top).toBeGreaterThanOrEqual(geometry.readingTop + 3);
    expect(geometry.top).toBeLessThanOrEqual(geometry.readingTop + 5);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(Math.abs(geometry.left + 22 - geometry.feedRight)).toBeLessThanOrEqual(32);
    expect(geometry.lowerTop).toBeGreaterThan(geometry.top + 44);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.viewportHeight - geometry.bottom).toBeLessThanOrEqual(20);
  }
});

test('an unstuck short-screen dock leaves a reachable upper shortcut outside feed containment', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 720, height: 360 });
  await page.goto('?date=2022-05');
  const { up } = await qualifyTimelineShortcuts(page);
  await expect(up).toHaveAttribute('data-dock-detached', '');
  const target = (await up.boundingBox())!;
  expect(target.y).toBeGreaterThanOrEqual(0);
  expect(target.y + target.height).toBeLessThan(360 - 44);
  expect(await up.evaluate((element) => element.closest('[data-timeline]'))).toBeNull();
  await up.focus();
  await page.setViewportSize({ width: 720, height: 900 });
  await expect(up).not.toHaveAttribute('data-dock-detached', '');
  await expect(up).toBeFocused();
});

test('trusted mobile touch scrolling qualifies shortcuts without a programmatic initial reveal', async ({
  page,
  context,
  isMobile,
  browserName,
}) => {
  // CDP supplies genuine touch scrolling only in Chromium; cross-engine layout/intent checks run above.
  test.skip(
    !isMobile || browserName !== 'chromium',
    'Trusted CDP touch input requires mobile Chromium.',
  );
  await page.goto('');
  const { up, down } = timelineShortcuts(page);
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  const cdp = await context.newCDPSession(page);
  try {
    for (let gesture = 0; gesture < 4 && !(await up.isVisible()); gesture++) {
      const before = await page.evaluate(() => scrollY);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 200, y: 700 }],
      });
      for (let y = 650; y >= 300; y -= 50)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 200, y }],
        });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
    }
    await expect(up).toBeVisible();
    await expect(down).toBeVisible();
  } finally {
    await cdp.detach();
  }
});
