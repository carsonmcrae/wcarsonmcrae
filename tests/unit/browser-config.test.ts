/**
 * Purpose: Preserve browser-test coverage across local, CI, and project-path environments.
 * Scope: Required engines, HTTPS preview, strict CI behavior, and explicit WebKit opt-in.
 * Does NOT belong: Launching browsers or producing synthetic coverage for their tests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@playwright/test', () => ({
  defineConfig: (config: unknown) => config,
  devices: {
    'Desktop Chrome': { userAgent: 'desktop-fixture' },
    'Pixel 7': { userAgent: 'mobile-fixture' },
    'iPhone 13': { userAgent: 'webkit-fixture' },
  },
}));
beforeEach(() => {
  vi.resetModules();
  for (const name of ['CI', 'PW_WEBKIT', 'BASE_PATH', 'PREVIEW_PORT']) vi.stubEnv(name, undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('browser verification configuration', () => {
  it('uses the root HTTPS preview locally and keeps failures visible without retries', async () => {
    const { default: config } = await import('../../playwright.config');
    expect(config).toMatchObject({
      retries: 0,
      forbidOnly: false,
      workers: 4,
      use: { baseURL: 'https://127.0.0.1:4323/' },
      projects: [{ name: 'desktop-chromium' }, { name: 'mobile-chromium' }],
      webServer: { reuseExistingServer: true },
    });
  });
  it.each([
    ['1', undefined],
    [undefined, '1'],
  ])('requires WebKit in CI or when explicitly enabled (%s, %s)', async (ci, webkit) => {
    vi.stubEnv('CI', ci);
    vi.stubEnv('PW_WEBKIT', webkit);
    vi.stubEnv('BASE_PATH', '/profile/');
    vi.stubEnv('PREVIEW_PORT', '4329');
    const { default: config } = await import('../../playwright.config');
    expect(config).toMatchObject({
      forbidOnly: Boolean(ci),
      workers: ci ? 2 : 4,
      use: { baseURL: 'https://127.0.0.1:4329/profile/' },
      projects: [
        { name: 'desktop-chromium' },
        { name: 'mobile-chromium' },
        { name: 'mobile-webkit' },
      ],
      webServer: { reuseExistingServer: !ci },
    });
  });
});
