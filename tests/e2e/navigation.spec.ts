/**
 * Purpose: Browser tests for navigation and routing.
 * Scope: Direct loads of every page, the main navigation and its current-page state, the small-screen
 *   menu (open, Escape, outside click, link choice), back and forward, the 404 page, and the links to
 *   Carson's portfolio, GitHub, and TTSNative.
 * Does NOT belong: Accessibility audits (accessibility.spec.ts) or theme behavior (theme.spec.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test } from '@playwright/test';
import { NAV_PAGES, openMenuIfCollapsed, PAGES } from './helpers';

test.describe('routing', () => {
  for (const { name, path } of PAGES) {
    test(`${name} loads directly with a unique title and one h1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/Daysforth/);
    });
  }

  test('unknown paths show the 404 page', async ({ page }) => {
    await page.goto('this-page-does-not-exist/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('wandered off');
    await expect(page.getByRole('link', { name: 'Take me home' })).toBeVisible();
  });
});

test.describe('main navigation', () => {
  test('reaches every section and marks the current page', async ({ page }) => {
    await page.goto('');
    for (const { name, path } of NAV_PAGES) {
      await openMenuIfCollapsed(page);
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await openMenuIfCollapsed(page);
      const current = page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name, exact: true });
      await expect(current).toHaveAttribute('aria-current', 'page');
    }
  });

  test('supports back and forward', async ({ page }) => {
    await page.goto('');
    await page.goto('about/');
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/about\/$/);
  });

  test('the brand link returns home', async ({ page }) => {
    await page.goto('work/');
    await page.getByRole('link', { name: 'Daysforth', exact: true }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/work\/$/);
  });
});

test.describe('small-screen menu', () => {
  // Each test runs in both mobile engines; the desktop layout has persistent navigation instead.
  test.skip(({ isMobile }) => !isMobile, 'The collapsible menu exists only on small screens.');

  test('opens, closes with Escape, and returns focus', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Menu', exact: true });
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: 'About' })).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('closes on an outside click and after choosing a page', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Menu', exact: true });
    await toggle.click();
    await expect(page.locator('#site-menu')).toBeVisible();
    await page.mouse.click(page.viewportSize()!.width - 5, 100);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Life' })
      .click();
    await expect(page).toHaveURL(/life\/$/);
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('works from the keyboard', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Menu', exact: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const close = page.getByRole('button', { name: 'Close menu', exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#site-menu .mobile-drawer__brand')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link').first(),
    ).toBeFocused();
  });
});

test.describe('outbound links', () => {
  test('the homepage links to the portfolio and GitHub, and project moments link to their product', async ({
    page,
  }) => {
    await page.goto('');
    const hrefs = await page
      .locator('main a[href^="https://"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs).toContain('https://carsonmcrae.github.io/');
    expect(hrefs).toContain('https://github.com/carsonmcrae');
    await page.locator('#moment-ttsnative-1 h3 a').click();
    await expect(page.locator('main a[href="https://ttsnative.com"]')).toBeVisible();
  });

  test('the work page links every project and LinkedIn', async ({ page }) => {
    await page.goto('work/');
    for (const href of [
      'https://github.com/carsonmcrae/ttsnative',
      'https://carsonmcrae.github.io/recalen/',
      'https://carsonmcrae.github.io/picpledge/',
      'https://www.linkedin.com/in/carsonmcrae/',
    ]) {
      await expect(page.locator(`main a[href="${href}"]`).first()).toBeAttached();
    }
  });
});
