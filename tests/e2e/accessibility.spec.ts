/**
 * Purpose: Automated Section 508 / WCAG 2.2 AA checks in real browsers.
 * Scope: axe (WCAG 2.0, 2.1, and 2.2 A and AA rules) on every page in light and dark themes and in
 *   forced-colors mode; the skip link and visible focus; reflow at 320 px, 200% text, and the WCAG
 *   text-spacing overrides; 44 px targets for standalone controls; reduced motion; and the site
 *   without JavaScript.
 * Constraints: Passing these checks does not certify conformance; manual screen reader checks are
 *   recorded separately (docs/governance/accessibility.md).
 * Does NOT belong: Navigation behavior (navigation.spec.ts) or the theme toggle (theme.spec.ts).
 */
import { expect, test } from '@playwright/test';
import { horizontalOverflow, PAGES, expectNoViolations } from './helpers';

test.describe('axe audits', () => {
  for (const { name, path } of PAGES) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`${name} passes in the ${colorScheme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        await page.goto(path);
        await expectNoViolations(page);
      });
    }
  }

  test('the 404 page passes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('missing-page/');
    await expectNoViolations(page);
  });
});

test.describe('keyboard', () => {
  test('the skip link comes first and moves focus to the main content', async ({ page }) => {
    await page.goto('');
    await page.locator('html[data-site-ready="true"]').waitFor();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('every focused control shows a visible focus indicator', async ({ page }) => {
    await page.goto('');
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      if (outline) {
        expect(outline.style).not.toBe('none');
        expect(outline.width).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

test.describe('reflow, zoom, and spacing', () => {
  // The site's Content-Security-Policy blocks injected styles (as it should), so these checks,
  // which simulate a reader's own text-size and spacing overrides, run with it bypassed.
  test.use({ bypassCSP: true });

  for (const { name, path } of PAGES) {
    test(`${name} reflows at 320 px with 200% text and WCAG text spacing`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      await page.addStyleTag({
        content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
      });
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('targets and preferences', () => {
  test('standalone controls are at least 44 by 44 pixels', async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(path);
      const small = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, .control, header nav a, footer nav a, .explain label',
          ),
        )
          .filter((element) => element.offsetParent !== null)
          .map((element) => ({
            label: element.textContent?.trim() || element.getAttribute('aria-label'),
            box: element.getBoundingClientRect(),
          }))
          .filter(({ box }) => box.width < 44 || box.height < 44)
          .map(({ label, box }) => `${label} (${Math.round(box.width)}×${Math.round(box.height)})`),
      );
      expect(small, path).toEqual([]);
    }
  });

  test('reduced motion turns off smooth scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    const behavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(behavior).toBe('auto');
  });

  test('forced-colors mode keeps pages usable and accessible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    for (const { path } of PAGES.slice(0, 3)) {
      await page.goto(path);
      await expectNoViolations(page);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const { name, path } of PAGES) {
    test(`${name} is readable and navigable`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav.getByRole('link', { name: 'Work', exact: true })).toBeVisible();
      // The theme switch needs JavaScript, so it is hidden rather than shown broken.
      await expect(page.getByRole('button', { name: 'Dark mode' })).toBeHidden();
    });
  }
});
