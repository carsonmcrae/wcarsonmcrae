/**
 * Purpose: Exercise the polished timeline, photo viewer, privacy choices, and app navigation.
 * Scope: Real rendered interaction, modal keyboard/inert behavior, consistent media, and history.
 * Does NOT belong: Backend SQL contracts or real production votes.
 */
import { expect, test } from '@playwright/test';
import { allowStorage, expectNoViolations } from './helpers';

test('an added reaction remains selected and cannot be toggled off after navigating', async ({
  page,
}) => {
  await allowStorage(page);
  await page.addInitScript(() => localStorage.setItem('daysforth.reacted.born', 'true'));
  await page.goto('posts/born/');
  const selected = page.locator('[data-post-actions="born"] [data-react="heart"]');
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(selected).toBeDisabled();
  await page.locator('header .site-header__name').click();
  await expect(selected).toBeDisabled();
});

test('the native date range accepts pointer dragging while its dock is sticky', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch and keyboard states are covered by the mobile date-jump checks.');
  await page.goto('?date=2022-05');
  const range = page.locator('[data-date-slider]');
  const box = (await range.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.83, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, y, { steps: 8 });
  await page.mouse.up();
  await expect(range).not.toHaveAttribute('aria-valuetext', 'May 2022');
  await expect(page).not.toHaveURL(/date=2022-05/);
  await expect(page.locator('[data-timeline-empty] a')).toBeVisible();
});

test('optional storage requires a choice and can be withdrawn', async ({ page }) => {
  await page.goto('');
  await page.locator('html[data-site-ready="true"]').waitFor();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole('button', { name: 'Save Built Daysforth', exact: true }).click();
  const settings = page.locator('[data-storage-dialog]');
  await expect(settings).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('daysforth.saved.built-daysforth')),
  ).toBeNull();
  await expectNoViolations(page);
  await settings.getByRole('button', { name: 'Allow storage', exact: true }).click();
  await expect(settings).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Save Built Daysforth', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.timeline-menu summary').nth(0).click();
  await page.getByRole('radio', { name: 'Milestones', exact: true }).check();
  await expect(page.locator('[data-moment]')).toHaveCount(6);
  await page.locator('footer [data-storage-open]').click();
  await settings.getByRole('button', { name: 'Keep storage off', exact: true }).click();
  await page.locator('.timeline-menu summary').nth(0).click();
  await page.getByRole('radio', { name: 'All categories', exact: true }).check();
  await expect(page.locator('[data-moment]')).toHaveCount(24);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['daysforth.consent.v1']);
  expect(await page.context().cookies()).toEqual([]);
});

test('photos enlarge everywhere and keyboard dismissal restores the trigger', async ({ page }) => {
  for (const [path, selector] of [
    ['', '.profile-summary [data-photo]'],
    ['', '.pinned-moments [data-photo]'],
    ['posts/watch-collecting/', '.post-album [data-photo]'],
    ['life/', '.photo-gallery [data-photo]'],
  ]) {
    await page.goto(path!);
    const photo = page.locator(selector!).first();
    await photo.click();
    const viewer = page.locator('[data-photo-viewer]');
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('img')).toHaveJSProperty('complete', true);
    await expectNoViolations(page);
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(photo).toBeFocused();
  }
});

test('sticky slider keeps empty-date guidance until chosen and shortcuts reach both ends', async ({
  page,
}) => {
  await page.goto('?date=2022-05');
  const slider = page.getByRole('slider', { name: 'Explore Carson’s timeline by date' });
  await slider.press('ArrowLeft');
  await expect(page).toHaveURL(/date=2022-04/);
  const nearest = page.getByRole('link', { name: 'Go to the nearest moment · May 2022' });
  await expect(nearest).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nearest).toBeAttached();
  await nearest.click();
  await expect(page.locator('[data-timeline-empty]')).toBeHidden();
  await page.getByRole('button', { name: 'Bottom of timeline, oldest moment' }).click();
  await expect(page.locator('#moment-born')).toBeInViewport();
  await page.getByRole('button', { name: 'Top of timeline, newest moment' }).click();
  await expect(page.locator('#moment-built-daysforth')).toBeInViewport();
  expect((await page.locator('.site-header').boundingBox())!.y).toBe(0);
});

test('header navigation and post return preserve the native timeline position', async ({
  page,
}) => {
  await page.goto('?date=2022-05');
  await expect(page.locator('#moment-vanderbilt-graduation')).toBeInViewport();
  // Font swaps and the browser's click preparation may adjust the initial date-jump position.
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#moment-vanderbilt-graduation h3 a').scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await page.locator('#moment-vanderbilt-graduation h3 a').click();
  await expect(page.locator('h1')).toHaveText('Vanderbilt graduation');
  const nativeEntries = await page.evaluate(() => Boolean(window.navigation));
  if (nativeEntries)
    await page.getByRole('link', { name: 'Back to the timeline', exact: true }).click();
  else await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(page.locator('[data-timeline]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position, -1);
  await page.getByRole('button', { name: 'Go forward', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Vanderbilt graduation');
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(page.locator('#moment-vanderbilt-graduation')).toBeInViewport();
});

test('returning from a post refreshes a cached bookmark without moving the timeline', async ({
  page,
}) => {
  await allowStorage(page);
  await page.goto('?date=2022-05');
  await page.locator('#moment-vanderbilt-graduation h3 a').click();
  await page.getByRole('button', { name: 'Save Vanderbilt graduation', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  const moment = page.locator('#moment-vanderbilt-graduation');
  await expect(moment).toBeInViewport();
  await expect(moment.locator('[data-save]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Go forward', exact: true }).click();
  await page.getByRole('button', { name: 'Save Vanderbilt graduation', exact: true }).click();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(moment).toBeInViewport();
  await expect(moment.locator('[data-save]')).toHaveAttribute('aria-pressed', 'false');
});

test('related watch stories and external destinations are explicit', async ({ page }) => {
  await page.goto('posts/watch-collecting/');
  await page.locator('.post-detail__body a[href$="/posts/made-a-watch/"]').click();
  await expect(page.locator('h1')).toHaveText('Built a watch of my own');
  await expect(page.locator('main a[href$="/posts/watch-collecting/"]')).toBeVisible();
  const tutorial = page.locator('main a[href="https://www.youtube.com/watch?v=JM7Do8RU90c"]');
  await expect(tutorial).toHaveAttribute('target', '_blank');
  await expect(tutorial).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(tutorial).toHaveAccessibleName(/YouTube.*new tab/);
  for (const link of await page.locator('footer a').all())
    await expect(link).toHaveAttribute('target', '_blank');
});

test('media uses consistent quiet overlays and desktop right alignment', async ({
  page,
  isMobile,
}) => {
  await page.goto('');
  const dog = page.locator('#moment-margot-arrives .post-media');
  const graduation = page.locator('#moment-vanderbilt-graduation .post-media');
  for (const media of [dog, graduation]) {
    const hit = await media.locator('.post-media__open').boundingBox();
    expect(hit!.width).toBeGreaterThanOrEqual(44);
    const icon = await media.locator('.post-media__open svg').boundingBox();
    expect(icon!.width).toBeLessThanOrEqual(16);
    const badge = await media.locator('.post-media__count').boundingBox();
    expect(badge!.height).toBeLessThanOrEqual(28);
  }
  if (!isMobile) {
    const first = await dog.boundingBox();
    const second = await graduation.boundingBox();
    expect(first!.x).toBeCloseTo(second!.x, 0);
    expect(first!.width).toBeCloseTo(second!.width, 0);
  }
});

test('the mobile drawer is modal, left aligned, and closes with a swipe', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Desktop uses the persistent navigation bar.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const drawer = page.locator('#site-menu');
  await expect(drawer).toBeVisible();
  const box = await drawer.boundingBox();
  expect(box!.x).toBe(0);
  expect(box!.width).toBeGreaterThan(page.viewportSize()!.width * 0.8);
  await expectNoViolations(page);
  await drawer.getByRole('button', { name: 'Close menu', exact: true }).focus();
  await page.keyboard.press('Tab');
  await page.locator('main').focus();
  expect(
    await page.evaluate(() =>
      document.querySelector('#site-menu')!.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    const drawer = document.querySelector('#site-menu')!;
    const event = (type: string, point: string, x: number) => {
      const gesture = new Event(type, { bubbles: true });
      Object.defineProperty(gesture, point, { value: [{ clientX: x, clientY: 100 }] });
      drawer.dispatchEvent(gesture);
    };
    event('touchstart', 'touches', 220);
    event('touchend', 'changedTouches', 90);
  });
  await expect(drawer).toBeHidden();
});
