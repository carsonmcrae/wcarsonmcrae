/**
 * Purpose: Playwright configuration for the browser tests under tests/e2e.
 * Scope: Desktop Chromium, mobile Chromium, and mobile WebKit projects (WebKit runs in CI, or
 *   locally with PW_WEBKIT=1), the production preview server, and the base path the tests run
 *   under.
 * Does NOT belong: Unit tests (vitest.config.ts) or the tests themselves (tests/e2e).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { defineConfig, devices } from '@playwright/test';
import { normalizeBasePath } from './src/lib/deploy-config';

const isCI = Boolean(process.env['CI']);
const port = Number(process.env['PREVIEW_PORT'] ?? 4323);
const base = normalizeBasePath(process.env['BASE_PATH']);
const baseURL = `https://127.0.0.1:${port}${base === '/' ? '' : base}/`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  workers: isCI ? 2 : 4,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    // Only this temporary loopback test certificate is self-signed; production CSP stays intact.
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      // Linux headless shell can omit native-tab navigation events in this pinned browser release.
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    // WebKit is installed in CI; locally, run `npx playwright install webkit` and set PW_WEBKIT=1.
    ...(isCI || process.env['PW_WEBKIT'] === '1'
      ? [{ name: 'mobile-webkit', use: { ...devices['iPhone 13'] } }]
      : []),
  ],
  webServer: {
    command: `node tests/e2e/preview.ts ${port}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    ignoreHTTPSErrors: true,
    timeout: 60_000,
  },
});
