/**
 * Purpose: Preserve default monthly browsing and native annual reading from shared static cards.
 * Scope: Visible headings, continuous annual spacing, connectors, and monthly year boundaries.
 * Does NOT belong: Deferred command behavior, synthetic input, or hiding content to pass checks.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { timelinePosts } from '../../src/data/timeline';
import { groupMoments } from '../../src/lib/timeline-model';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`initial monthly groups retain headings and year-boundary spacing in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-timeline-ready', 'true');
    const headings = page.locator('.timeline-groups .moment-group > h2:visible');
    await expect(headings).toHaveText(
      groupMoments(timelinePosts, 'months').map((month) => month.label),
    );
    const boundary = await page.locator('.moment-group--year').evaluateAll((years) => {
      const first = years[0]!.querySelector(':scope > div')!;
      const second = years[1]!.querySelector(':scope > div')!;
      return {
        previousBottom: first.lastElementChild!.getBoundingClientRect().bottom,
        nextTop: second.firstElementChild!.getBoundingClientRect().top,
        annualDisplay: getComputedStyle(years[0]!).display,
        annualConnector: getComputedStyle(first, '::before').display,
      };
    });
    expect(boundary.annualDisplay).toBe('contents');
    expect(boundary.annualConnector).toBe('none');
    expect(boundary.nextTop - boundary.previousBottom).toBeCloseTo(40, 0);
  });
}

test.describe('native annual reading', () => {
  test.use({ javaScriptEnabled: false });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`retains annual headings and uninterrupted card spacing in ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('');
      await expect(page.locator('.timeline-groups .moment-group > h2:visible')).toHaveText(
        groupMoments(timelinePosts, 'years').map((year) => year.label),
      );
      const geometry = await page
        .locator('.moment-group--year')
        .first()
        .evaluate((year) => {
          const body = year.querySelector(':scope > div')!;
          const cards = year.querySelectorAll('.post-card');
          const monthBody = body.firstElementChild!.querySelector('div')!;
          return {
            gap: cards[1]!.getBoundingClientRect().top - cards[0]!.getBoundingClientRect().bottom,
            annualDisplay: getComputedStyle(body).display,
            annualConnector: getComputedStyle(body, '::before').display,
            monthDisplay: getComputedStyle(monthBody).display,
            monthConnector: getComputedStyle(monthBody, '::before').display,
          };
        });
      expect(geometry.gap).toBeCloseTo(12, 0);
      expect(geometry.annualDisplay).toBe('grid');
      expect(geometry.annualConnector).not.toBe('none');
      expect(geometry.monthDisplay).toBe('contents');
      expect(geometry.monthConnector).toBe('none');
    });
  }
});
