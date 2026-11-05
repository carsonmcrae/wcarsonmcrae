/**
 * Purpose: Keep the global photo viewer steady and its individual reactions scoped to each photograph.
 * Scope: Loaded image geometry, native filmstrip selection, roving keys, consent and intercepted fixture requests.
 * Does NOT belong: Live service writes, synthetic personal content, or mutating application markup.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';
import { carsonGallery } from '../../src/data/photo-gallery';
import { reactions } from '../../src/data/reactions';
import { photoReactionId } from '../../src/lib/photo-reaction-id';
import { allowStorage, expectNoViolations } from './helpers';

async function openCarsonAlbum(page: Page, remembered = false) {
  if (remembered) await allowStorage(page);
  await page.goto('about/');
  await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
  if (!remembered)
    await page.getByRole('button', { name: 'Keep storage off', exact: true }).click();
  const entry = page.locator('#carson-photos .album-preview__action');
  await entry.click();
  const viewer = page.getByRole('dialog', { name: 'Photo viewer', exact: true });
  await expect(viewer).toBeVisible();
  return { viewer, entry, strip: viewer.locator('[data-photo-strip]') };
}

async function viewerGeometry(page: Page) {
  return page.locator('[data-photo-viewer]').evaluate((viewer) => {
    const targets = [
      viewer,
      viewer.querySelector('[data-photo-stage]')!,
      viewer.querySelector('[data-photo-large]')!,
    ];
    return targets.map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    });
  });
}

async function mockPhotoReactions(page: Page) {
  const counts = Object.fromEntries(
    carsonGallery.photos.flatMap((photo) =>
      reactions.map(({ id }) => [
        id === 'heart' ? photoReactionId(photo.name) : `${photoReactionId(photo.name)}--${id}`,
        0,
      ]),
    ),
  );
  counts[photoReactionId(carsonGallery.photos[0]!.name)] = 5;
  counts[photoReactionId(carsonGallery.photos[1]!.name)] = 9;
  const state = { reads: 0, writes: [] as { key: string; visitorId: string }[] };
  await page.route('https://reactions.daysforth.test/**', async (route) => {
    const request = route.request();
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() === 'GET') {
      state.reads++;
      return route.fulfill({ json: counts, headers });
    }
    const key = decodeURIComponent(new URL(request.url()).pathname.split('/').at(-1)!);
    expect(counts, 'Only approved photograph keys may be submitted').toHaveProperty(key);
    state.writes.push({ key, visitorId: request.postDataJSON().visitorId });
    counts[key] = counts[key]! + 1;
    return route.fulfill({ json: { count: counts[key] }, headers });
  });
  return state;
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`fixed photo surface and filmstrip stay steady across album shapes in ${colorScheme}`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await mockPhotoReactions(page);
    const { viewer, entry, strip } = await openCarsonAlbum(page);
    const baseline = await viewerGeometry(page);
    const pagePosition = await page.evaluate(() => scrollY);
    const thumbnails = strip.getByRole('button');
    await expect(thumbnails).toHaveCount(carsonGallery.photos.length);
    const viewport = page.viewportSize()!;
    expect(baseline[0]!.x).toBeGreaterThanOrEqual(0);
    expect(baseline[0]!.y).toBeGreaterThanOrEqual(0);
    expect(baseline[0]!.x + baseline[0]!.width).toBeLessThanOrEqual(viewport.width);
    expect(baseline[0]!.y + baseline[0]!.height).toBeLessThanOrEqual(viewport.height);
    for (const [index, photo] of carsonGallery.photos.entries()) {
      const image = viewer.locator('[data-photo-large]');
      await expect(image).toHaveAttribute('alt', photo.alt);
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      await expect(image).toHaveCSS('object-fit', 'contain');
      await expect(viewer.locator('[data-photo-caption-output]')).toHaveText(photo.caption);
      await expect(viewer.locator('[data-photo-related]')).toBeVisible({
        visible: Boolean(photo.postId),
      });
      const rectangles = await viewerGeometry(page);
      for (const [position, rectangle] of rectangles.entries()) {
        expect(rectangle.width).toBeGreaterThan(0);
        expect(rectangle.height).toBeGreaterThan(0);
        expect(rectangle.width).toBeCloseTo(baseline[position]!.width, 0);
        expect(rectangle.height).toBeCloseTo(baseline[position]!.height, 0);
      }
      await expect(thumbnails.nth(index)).toHaveAttribute('aria-current', 'true');
      await expect(thumbnails.nth(index).locator('img')).toHaveAttribute('alt', '');
      await viewer.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await thumbnails.first().focus();
    await page.keyboard.press('End');
    await expect(thumbnails.last()).toBeFocused();
    await expect(viewer.locator('[data-photo-count]')).toHaveText(
      `Photo ${carsonGallery.photos.length} of ${carsonGallery.photos.length}`,
    );
    if (isMobile) expect(await strip.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press('Home');
    await expect(thumbnails.first()).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(thumbnails.last()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(thumbnails.first()).toBeFocused();
    await thumbnails.nth(2).click();
    await expect(viewer.locator('[data-photo-large]')).toHaveAttribute(
      'alt',
      carsonGallery.photos[2]!.alt,
    );
    expect(
      await thumbnails.evaluateAll(
        (buttons) => buttons.filter((button) => button.tabIndex === 0).length,
      ),
    ).toBe(1);
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(pagePosition, 0);
    await expectNoViolations(page);
    await page.keyboard.press('Escape');
    await expect(entry).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(pagePosition, 0);
  });
}

for (const remembered of [false, true]) {
  test(`mocked photo reactions remain independent with storage ${remembered ? 'remembered' : 'off'}`, async ({
    page,
  }) => {
    const fixture = await mockPhotoReactions(page);
    const { viewer, strip } = await openCarsonAlbum(page, remembered);
    await expect
      .poll(() => fixture.reads, {
        message:
          'Build with PUBLIC_REACTIONS_URL=https://reactions.daysforth.test before running the photo reaction fixtures.',
      })
      .toBeGreaterThan(0);
    const love = viewer.locator('[data-photo-react="heart"]');
    const count = love.locator('[data-photo-reaction-count]');
    await expect(count).toHaveText('5');
    await expect(love).toBeEnabled();
    await love.click();
    await expect(count).toHaveText('6');
    await expect(love).toHaveAttribute('aria-pressed', 'true');
    await strip.getByRole('button').nth(1).click();
    await expect(count).toHaveText('9');
    await expect(love).toHaveAttribute('aria-pressed', 'false');
    await love.click();
    await expect(count).toHaveText('10');
    expect(fixture.writes.map(({ key }) => key)).toEqual(
      carsonGallery.photos.slice(0, 2).map((photo) => photoReactionId(photo.name)),
    );
    expect(fixture.writes[0]!.visitorId).toMatch(/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
    expect(fixture.writes[1]!.visitorId).toBe(fixture.writes[0]!.visitorId);
    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter(
        (key) => key === 'daysforth.visitor' || key.startsWith('daysforth.reacted.'),
      ),
    );
    expect(stored.length > 0).toBe(remembered);
    await viewer.getByRole('button', { name: 'Close photo viewer', exact: true }).click();
    await page.reload();
    await page.locator('#carson-photos .album-preview__action').click();
    await expect(count).toHaveText('6');
    await expect(love).toHaveAttribute('aria-pressed', String(remembered));
    expect(fixture.writes).toHaveLength(2);
  });
}

test.describe('reader-sized photo captions', () => {
  // Match the existing accessibility text-size test; the production CSP stays enabled elsewhere.
  test.use({ bypassCSP: true });

  test('200% caption text is keyboard-scrollable without moving the background', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { viewer, strip } = await openCarsonAlbum(page);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const messiPhoto = strip.getByRole('button').nth(5);
    await messiPhoto.click();
    await expect(viewer.locator('[data-photo-caption-output]')).toHaveText(
      carsonGallery.photos[5]!.caption,
    );
    const caption = viewer.getByRole('region', { name: 'Photo caption', exact: true });
    expect(await caption.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    const background = await page.evaluate(() => scrollY);
    await messiPhoto.focus();
    await page.keyboard.press('Tab');
    await expect(caption).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect.poll(() => caption.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('End');
    await expect
      .poll(() =>
        caption.evaluate((element) => {
          const text = element.querySelector('[data-photo-caption-output]')!;
          return text.getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom + 1;
        }),
      )
      .toBe(true);
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(background, 0);
  });
});
