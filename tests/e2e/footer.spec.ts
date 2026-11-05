/**
 * Purpose: Keep the selected compact footer usable without changing browser-storage consent.
 * Scope: Visible essentials, all More destinations, native dismissal, narrow reflow, and both themes.
 * Does NOT belong: Replacing the storage banner or testing provider navigation after a new tab opens.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { expectNoViolations, horizontalOverflow } from './helpers';
import { currentVersion } from '../../src/data/releases';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`compact footer preserves essentials and keyboard-safe More in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-site-ready', 'true');
    const notice = page.getByRole('complementary', { name: 'Browser storage choice' });
    await expect(notice).toContainText('Remember this browser?');
    const firstVisitFooter = (await page.locator('.site-footer').boundingBox())!;
    expect(firstVisitFooter.y + firstVisitFooter.height).toBeLessThanOrEqual(
      (await notice.boundingBox())!.y,
    );
    await notice.getByRole('button', { name: 'Keep storage off', exact: true }).click();
    await expect(notice).toBeHidden();
    const footer = page.locator('.site-footer');
    await footer.scrollIntoViewIfNeeded();
    for (const label of ['Privacy', 'Accessibility', `Releases v${currentVersion}`])
      await expect(
        footer.getByRole('link', { name: `${label} (opens in a new tab)`, exact: true }),
      ).toBeVisible();
    const settings = footer.getByRole('button', {
      name: 'Settings for browser storage',
      exact: true,
    });
    await expect(settings).toBeVisible();
    await expect(settings).toHaveText('Settings');
    const more = footer.locator('[data-disclosure-menu]');
    const trigger = more.locator('summary');
    const triggerBounds = (await trigger.boundingBox())!;
    expect(triggerBounds.height).toBeGreaterThanOrEqual(44);
    expect(triggerBounds.width).toBeGreaterThanOrEqual(44);
    const panel = footer.getByRole('navigation', { name: 'More footer links' });
    await expect(panel).toBeHidden();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();
    const destinations = [
      'Timeline',
      'Work',
      'Life',
      'About',
      'Contact',
      'Brand kit',
      'Source on GitHub',
    ];
    await expect(panel.getByRole('link')).toHaveCount(destinations.length);
    for (const label of destinations) {
      const link = panel.getByRole('link', { name: new RegExp(`^${label}`) });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAccessibleName(/opens in a new tab/);
      const bounds = (await link.boundingBox())!;
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.width).toBeGreaterThanOrEqual(44);
    }
    const panelBounds = (await panel.boundingBox())!;
    const triggerPosition = (await trigger.boundingBox())!;
    if (page.viewportSize()!.width <= 640)
      expect(panelBounds.y).toBeGreaterThanOrEqual(triggerPosition.y + triggerPosition.height);
    else expect(panelBounds.y + panelBounds.height).toBeLessThanOrEqual(triggerPosition.y);
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await footer.locator('.site-footer__legal').click();
    await expect(panel).toBeHidden();
    await settings.click();
    await expect(page.getByRole('dialog', { name: 'Browser storage', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.reload();
    await expect(notice).toBeHidden();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expectNoViolations(page);
  });

  test(`compact footer and expanded destinations reflow at 320 px in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('privacy/');
    await page
      .getByRole('complementary', { name: 'Browser storage choice' })
      .getByRole('button', { name: 'Keep storage off', exact: true })
      .click();
    const footer = page.locator('.site-footer');
    await footer.scrollIntoViewIfNeeded();
    expect(await footer.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe(
      '1px',
    );
    expect(
      await footer
        .locator('.site-footer__legal')
        .evaluate((element) => getComputedStyle(element).borderTopWidth),
    ).toBe('0px');
    await footer.locator('summary').click();
    const bounds = (await footer.locator('.site-footer__menu-panel').boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    for (const link of await footer.locator('.site-footer__menu-panel a').all()) {
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport();
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await horizontalOverflow(page)).toBe(0);
    await expectNoViolations(page);
  });
}
