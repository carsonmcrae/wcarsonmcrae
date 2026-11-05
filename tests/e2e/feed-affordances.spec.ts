/**
 * Purpose: Verify useful feed shortcuts, restrained image corners, and deliberate touch activation.
 * Scope: Actual scrolling, hover/focus reveal, independent photo/post taps, and desktop moment browsing.
 * Does NOT belong: Gallery carousel mechanics or persisted timeline state.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';

test('timeline shortcuts require user scrolling and hide the direction that is already reached', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  const up = page.getByRole('button', { name: 'Top of timeline, newest moment' });
  const down = page.getByRole('button', { name: 'Bottom of timeline, oldest moment' });
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  await page.goto('?date=2022-05');
  await expect(page.locator('#moment-vanderbilt-graduation')).toBeInViewport();
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
  await page.keyboard.press('PageDown');
  await expect(up).toBeVisible();
  await expect(down).toBeVisible();
  await up.click();
  await expect(up).toBeHidden();
  await expect(down).toBeVisible();
  await page.locator('#moment-born').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const bottom = document.querySelector('[data-timeline-groups]')!.getBoundingClientRect().bottom;
    scrollBy({ top: bottom - innerHeight + 1, behavior: 'instant' });
  });
  await expect(down).toBeHidden();
  await expect(up).toBeVisible();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(up).toBeHidden();
  await expect(down).toBeHidden();
});

test('image corner visuals straddle the photograph while their hidden targets stay inert and keyboard reachable', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  const card = page.locator('#moment-vanderbilt-graduation');
  await card.scrollIntoViewIfNeeded();
  const expand = card.locator('.post-media__open');
  await expect(expand).toHaveCSS('opacity', '0');
  await expect(expand).toHaveCSS('pointer-events', 'none');
  if (!isMobile) {
    await card.locator('h3 a').hover();
    await expect(expand).toHaveCSS('opacity', '1');
    await page.mouse.move(0, 0);
    await expect(expand).toHaveCSS('opacity', '0');
  }
  await card.locator('h3 a').focus();
  await expect(expand).toHaveCSS('opacity', '1');
  await expand.focus();
  await expect(expand).toBeFocused();
  const geometry = await expand.evaluate((element) => {
    const target = element.getBoundingClientRect();
    const photo = element.parentElement!.querySelector('[data-photo] img')!.getBoundingClientRect();
    const count = element
      .parentElement!.querySelector('.post-media__count')!
      .getBoundingClientRect();
    const visual = Number.parseFloat(getComputedStyle(element, '::before').width);
    return {
      width: target.width,
      height: target.height,
      visualTop: target.top + (target.height - visual) / 2 - photo.top,
      visualRight: target.right - (target.width - visual) / 2 - photo.right,
      countTop: count.top - photo.top,
      countLeft: count.left - photo.left,
    };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(geometry.visualTop).toBeCloseTo(-6, 0);
  expect(geometry.visualRight).toBeCloseTo(6, 0);
  expect(geometry.countTop).toBeCloseTo(-6, 0);
  expect(geometry.countLeft).toBeCloseTo(-6, 0);
});

test('a first touch reveals the card, a second photo touch opens the viewer, and title links navigate directly', async ({
  page,
  isMobile,
}) => {
  // Desktop projects lack touch input; their hover and keyboard paths are covered above.
  test.skip(
    !isMobile,
    'This verifies touch input; desktop hover and keyboard reveal have their own case.',
  );
  await page.goto('');
  const card = page.locator('#moment-vanderbilt-graduation');
  const photo = card.locator('[data-photo]');
  await photo.scrollIntoViewIfNeeded();
  await photo.tap();
  await expect(page.locator('[data-photo-viewer]')).toBeHidden();
  await expect(card.locator('.post-media__open')).toHaveCSS('opacity', '1');
  await photo.tap();
  await expect(page.locator('[data-photo-viewer]')).toBeVisible();
  await page.keyboard.press('Escape');
  await card.locator('.post-media__open').tap();
  await expect(page).toHaveURL(/\/posts\/vanderbilt-graduation\/$/);
  await page.goto('');
  await card.locator('h3 a').tap();
  await expect(page).toHaveURL(/\/posts\/vanderbilt-graduation\/$/);
});

test('the desktop moment list keeps same-month destinations distinct, opens clusters, and preserves keyboard escape', async ({
  page,
  isMobile,
}) => {
  // Mobile layouts intentionally omit the desktop gutter rail; touch controls are covered above.
  test.skip(isMobile, 'The moment rail requires the desktop gutter.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  const rail = page.getByRole('button', { name: 'Browse timeline moments', exact: true });
  await expect(rail).toBeHidden();
  await page.goto('?date=2022-05&detail=years');
  await expect(rail).toBeVisible();
  const list = page.locator('[data-moment-links]');
  const entries = await list
    .locator('a')
    .evaluateAll((links) => links.map((link) => (link as HTMLElement).dataset['jumpMoment']!));
  const railBounds = (await rail.boundingBox())!;
  const hoverPosition = await page.evaluate(() => scrollY);
  for (const fraction of [0.02, 0.5, 0.98]) {
    const item = list.locator(
      `[data-jump-moment="${entries[Math.floor(fraction * entries.length)]!}"]`,
    );
    await page.mouse.move(
      railBounds.x + railBounds.width / 2,
      railBounds.y + railBounds.height * fraction,
    );
    await expect(item).toHaveAttribute('data-preview', 'true');
    const bounds = (await item.boundingBox())!;
    const preview = (await page.locator('[data-moment-previews]').boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(preview.y);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(preview.y + preview.height + 1);
    expect(await page.evaluate(() => scrollY)).toBe(hoverPosition);
  }
  await page.mouse.move(0, 0);
  await rail.focus();
  await page.keyboard.press('Enter');
  await expect(list.locator('a')).toHaveCount(24);
  const position = await page.evaluate(() => scrollY);
  await page.keyboard.press('End');
  await expect(list.locator('a').last()).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(position);
  expect(
    await page.locator('[data-moment-previews]').evaluate((element) => element.scrollTop),
  ).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(rail).toBeFocused();
  await expect(page.locator('[data-moment-previews]')).toBeHidden();
  const ids = await list
    .locator('[data-jump-date^="2026-10"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLElement).dataset['jumpMoment']!));
  expect(ids.length).toBeGreaterThan(1);
  for (const id of ids) {
    await rail.focus();
    await page.keyboard.press('Enter');
    await list.locator(`[data-jump-moment="${id}"]`).click();
    const card = page.locator(`#moment-${id}`);
    await expect(card).toBeInViewport();
    await expect(card.locator('h3 a')).toBeFocused();
    await expect(card.locator('xpath=ancestor::details')).toHaveJSProperty('open', true);
    await expect(page).toHaveURL(/date=2026-10/);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(rail).toBeVisible();
  const right = (await rail.boundingBox())!;
  const edge = await page.evaluate(() => document.documentElement.clientWidth);
  expect(edge - right.x - right.width).toBeGreaterThanOrEqual(0);
  expect(edge - right.x - right.width).toBeLessThanOrEqual(20);
  await page.getByRole('button', { name: 'Posts', exact: true }).click();
  await expect(rail).toBeHidden();
});
