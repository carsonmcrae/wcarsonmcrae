/**
 * Purpose: Protect the quiet navigation and image-boundary affordances across viewport sizes.
 * Scope: Header balance, drawer identity, footer destinations, photo framing, and modal scroll isolation.
 * Does NOT belong: Personal content approval or timeline filtering logic.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

test('the desktop navigation group is centered independently of the identity and theme control', async ({
  page,
  isMobile,
}) => {
  // This desktop geometry does not exist on mobile; the separate drawer case covers those projects.
  test.skip(isMobile, 'The mobile drawer replaces the desktop navigation.');
  await page.goto('');
  const header = (await page.locator('.site-header__inner').boundingBox())!;
  const links = (await page.locator('.site-header__desktop .primary-nav').boundingBox())!;
  expect(links.x + links.width / 2).toBeCloseTo(header.x + header.width / 2, 0);
  const identity = (await page.locator('.site-header__identity').boundingBox())!;
  expect(identity.x + identity.width).toBeLessThanOrEqual(links.x);
});

test('mobile navigation carries the approved identity and a quiet content-width storage action', async ({
  page,
  isMobile,
}) => {
  // The drawer is a mobile-only surface; desktop footer settings are checked in their own case.
  test.skip(!isMobile, 'Desktop exposes storage settings in the footer.');
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const drawer = page.locator('#site-menu');
  await expect(drawer.locator('.mobile-drawer__brand img')).toHaveAttribute(
    'src',
    /\/brand\/daysforth-mark\.svg$/,
  );
  const action = drawer.getByRole('button', { name: 'Storage settings', exact: true });
  const target = (await action.boundingBox())!;
  const panel = (await drawer.boundingBox())!;
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.width).toBeLessThan(panel.width * 0.75);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});

test('a post overlay follows the actual portrait or screenshot rather than its surrounding mat', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  for (const selector of ['#moment-vanderbilt-graduation', '#moment-built-daysforth']) {
    const media = page.locator(`${selector} .post-media`);
    await media.scrollIntoViewIfNeeded();
    const { image, overlay } = await media.evaluate((element) => ({
      image: element.querySelector('[data-photo] img')!.getBoundingClientRect().toJSON(),
      overlay: element.querySelector('.post-media__open')!.getBoundingClientRect().toJSON(),
    }));
    expect(Math.abs(overlay.x + overlay.width - (image.x + image.width + 18))).toBeLessThan(2);
    expect(Math.abs(overlay.y - (image.y - 18))).toBeLessThan(2);
    expect(overlay.width).toBeGreaterThanOrEqual(44);
    expect(overlay.height).toBeGreaterThanOrEqual(44);
  }
});

test('photo dialogs lock background scrolling and restore the page when dismissed', async ({
  page,
  browserName,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  await page.locator('html[data-site-ready="true"]').waitFor();
  const trigger = page.locator('#moment-margot-arrives [data-photo]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.locator('[data-photo-viewer]');
  await expect(dialog).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('body')).toHaveCSS('overflow-y', 'hidden');
  const position = await page.evaluate(() => scrollY);
  await page.keyboard.press('PageDown');
  if (browserName !== 'webkit' || !isMobile) {
    await page.mouse.move(4, page.viewportSize()!.height - 4);
    await page.mouse.wheel(0, 600);
  }
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await page.evaluate(() => scrollY)).toBe(position);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  expect(await page.evaluate(() => scrollY)).toBe(position);
});

test('footer essentials stay visible while More retains the remaining destinations', async ({
  page,
}) => {
  await page.goto('');
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.getByRole('link', { name: /Releases v/ })).toHaveAttribute(
    'href',
    /\/releases\/$/,
  );
  for (const label of ['Privacy', 'Accessibility']) {
    await expect(
      footer.getByRole('link', { name: `${label} (opens in a new tab)`, exact: true }),
    ).toBeVisible();
  }
  const settings = footer.getByRole('button', {
    name: 'Settings for browser storage',
    exact: true,
  });
  const target = (await settings.boundingBox())!;
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(target.width).toBeLessThan(200);
  const more = footer.locator('[data-disclosure-menu]');
  await expect(more).not.toHaveAttribute('open', '');
  await more.locator('summary').click();
  for (const label of [
    'Timeline',
    'Work',
    'Life',
    'About',
    'Contact',
    'Brand kit',
    'Source on GitHub',
  ])
    await expect(more.getByRole('link', { name: new RegExp(label) })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(more).not.toHaveAttribute('open', '');
  await settings.click();
  await expect(page.getByRole('dialog', { name: 'Browser storage', exact: true })).toBeVisible();
});

test('timeline shortcuts sit at opposite screen edges with room for sticky browsing controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('?date=2022-05');
  await page.locator('html[data-site-ready="true"]').waitFor();
  await page.keyboard.press('PageDown');
  await expect(page.locator('[data-timeline-edge="newest"]')).toBeVisible();
  const top = (await page.locator('[data-timeline-edge="newest"]').boundingBox())!;
  const bottom = (await page.locator('[data-timeline-edge="oldest"]').boundingBox())!;
  const header = (await page.locator('.site-header').boundingBox())!;
  const dock = (await page.locator('.timeline-dock').boundingBox())!;
  expect(top.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(top.y + top.height).toBeLessThan(bottom.y);
  expect(bottom.y + bottom.height).toBeLessThan(page.viewportSize()!.height);
  if (top.x < dock.x + dock.width && top.x + top.width > dock.x) {
    expect(top.y).toBeGreaterThanOrEqual(dock.y + dock.height);
  }
});
