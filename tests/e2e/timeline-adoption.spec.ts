/**
 * Purpose: Keep a card's active interaction intact when the deferred timeline controller arrives.
 * Scope: Real browser scrolling/focus during a held module request and original node continuity.
 * Does NOT belong: Sleeps, synthetic intent dispatch, or weakening command readiness assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';

test('adopts a focused static card after delayed module delivery without moving its original nodes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await page.route('**/timeline-mount.*.js', async (route) => {
    requested.resolve();
    await release.promise;
    await route.continue();
  });
  try {
    await page.goto('');
    const card = page.locator('#moment-vanderbilt-graduation');
    await card.scrollIntoViewIfNeeded();
    await requested.promise;
    const original = await card.evaluateHandle((element) => ({
      card: element,
      parent: element.parentElement,
      year: element.closest('.moment-group--year'),
    }));
    const title = card.locator('h3 a');
    await title.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(title).toBeFocused();
    release.resolve();
    await expect
      .poll(() =>
        card.evaluate(
          (element) => element.closest<HTMLElement>('.moment-group')!.dataset['period'],
        ),
      )
      .toBe('2022-05');
    await expect(title).toBeFocused();
    expect(
      await original.evaluate(({ card: element, parent, year }) => ({
        connected: element.isConnected,
        sameParent: element.parentElement === parent,
        sameYear: element.closest('.moment-group--year') === year,
      })),
    ).toEqual({ connected: true, sameParent: true, sameYear: true });
    await original.dispose();
  } finally {
    release.resolve();
  }
});
