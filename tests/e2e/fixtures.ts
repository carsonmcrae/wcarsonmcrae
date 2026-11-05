/**
 * Purpose: Isolate browser verification from the reserved reaction service endpoint.
 * Scope: Approved zero-count GET responses, CORS preflights, and explicit failures for unexpected mutations.
 * Constraints: Only reactions.daysforth.test is intercepted; specialized page routes take precedence.
 * Does NOT belong: Live Worker traffic, weakening runtime-health assertions, or accepting unplanned writes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test as base } from '@playwright/test';
import { supportedReactionKeys } from '../../src/data/reaction-targets';

const endpoint = 'https://reactions.daysforth.test/**';
const zeroCounts = Object.fromEntries(supportedReactionKeys.map((key) => [key, 0]));

export const test = base.extend({
  page: async ({ page }, use) => {
    const unexpected: string[] = [];
    await page.context().route(endpoint, async (route) => {
      const request = route.request();
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      };
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers });
      } else if (request.method() === 'GET') {
        await route.fulfill({ json: zeroCounts, headers });
      } else {
        unexpected.push(`${request.method()} ${request.url()}`);
        await route.fulfill({
          status: 405,
          json: { error: 'Unexpected fixture mutation.' },
          headers,
        });
      }
    });
    await use(page);
    expect(
      unexpected,
      'Unexpected reaction mutation: install a specialized page.route fixture for an intentional write.',
    ).toEqual([]);
  },
});
