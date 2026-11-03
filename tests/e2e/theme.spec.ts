/**
 * Purpose: Browser tests for the light and dark themes.
 * Scope: Following the system preference, the labelled toggle and its announced state, persistence
 *   across pages and reloads, and no flash of the wrong theme on load.
 * Does NOT belong: Contrast audits (accessibility.spec.ts) or the toggle's unit tests.
 */
import { expect, test, type Page } from '@playwright/test';
import { openMenuIfCollapsed } from './helpers';

const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('follows the system preference until the visitor chooses', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('');
  const dark = await background(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => background(page)).not.toBe(dark);
});

test('the toggle has a visible label, announces its state, and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('');
  await openMenuIfCollapsed(page);
  const toggle = page.getByRole('button', { name: 'Dark mode' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const light = await background(page);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => background(page)).not.toBe(light);

  await page.goto('about/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a saved theme applies before the first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('', { waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
