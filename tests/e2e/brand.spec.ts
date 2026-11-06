/**
 * Purpose: Verify the approved logo sizes and complete downloadable brand kit.
 * Scope: Header artwork, small-size examples, published archive retrieval, and favicon identity.
 * Does NOT belong: Vector geometry fidelity (tests/unit/brand-assets.test.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { unzipSync } from 'fflate';

test('the brand guide uses the approved sizes and ships both logo drawings', async ({ page }) => {
  await page.goto('brand/');
  await expect(page.locator('.site-header__name img')).toHaveAttribute(
    'src',
    /\/brand\/daysforth-mark\.svg$/,
  );
  for (const size of [16, 24]) {
    const example = page.getByAltText(`Simplified Daysforth mark at ${size} pixels`, {
      exact: true,
    });
    const bounds = await example.boundingBox();
    expect(bounds?.width).toBe(size);
    expect(bounds?.height).toBe(size);
  }
  const link = page.getByRole('link', { name: 'Download the brand kit', exact: true });
  await expect(link).toHaveAttribute('download', 'daysforth-brand-kit.zip');
  const response = await page.request.get((await link.getAttribute('href'))!);
  expect(response.status()).toBe(200);
  const archive = unzipSync(await response.body());
  expect(Object.keys(archive)).toHaveLength(37);
  for (const name of [
    'daysforth-mark.svg',
    'daysforth-mark-small.svg',
    'daysforth-mark-small-mono.svg',
    'daysforth-mark-small-white.svg',
    'daysforth-lockup.svg',
    'daysforth-social.png',
    'favicon-16.png',
    'favicon-32.png',
    'icon-512.png',
  ])
    expect(archive[name], name).toBeDefined();
  expect(archive['favicon.svg']).toEqual(archive['daysforth-mark-small.svg']);
  expect(archive['daysforth-mark.svg']).not.toEqual(archive['daysforth-mark-small.svg']);
});
