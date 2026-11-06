/**
 * Purpose: Verify the deployed static-site configuration and its local HTTPS-only test seam.
 * Scope: CSP origins, sitemap filtering, self-hosted fonts, and paired test-certificate loading.
 * Does NOT belong: Running a build or weakening production certificate checks.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };
import type { AstroIntegration } from 'astro';

const dependencies = vi.hoisted(() => ({
  defineConfig: vi.fn((config: unknown) => config),
  localFont: vi.fn(() => ({ name: 'local-font' })),
  sitemap: vi.fn((_config: { filter: (url: string) => boolean }) => ({ name: 'sitemap' })),
  readFileSync: vi.fn((path: string) => Buffer.from(`test fixture: ${path}`)),
}));
vi.mock('astro/config', () => ({
  defineConfig: dependencies.defineConfig,
  fontProviders: { local: dependencies.localFont },
}));
vi.mock('@astrojs/sitemap', () => ({ default: dependencies.sitemap }));
vi.mock('node:fs', () => ({ readFileSync: dependencies.readFileSync }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  for (const name of [
    'SITE_URL',
    'BASE_PATH',
    'PUBLIC_REACTIONS_URL',
    'E2E_TLS_KEY',
    'E2E_TLS_CERT',
  ])
    vi.stubEnv(name, undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('Astro deployment configuration', () => {
  it('keeps the public build static, self-hosted, and constrained by CSP', async () => {
    const { default: config } = await import('../../astro.config.mjs');
    expect(config).toMatchObject({
      site: 'https://wcarsonmcrae.com',
      base: '/',
      trailingSlash: 'always',
      build: { format: 'directory' },
      vite: { define: { __DAYSFORTH_RELEASE__: JSON.stringify(manifest.version) } },
      devToolbar: { enabled: false },
      security: {
        csp: { directives: expect.arrayContaining(["default-src 'self'", "object-src 'none'"]) },
      },
    });
    expect(dependencies.localFont).toHaveBeenCalledTimes(2);
    expect(dependencies.readFileSync).not.toHaveBeenCalled();
    const integration = config
      .integrations!.flat()
      .filter((entry): entry is AstroIntegration => !!entry && !Array.isArray(entry))
      .find((entry) => entry.name === 'daysforth:deferred-modules');
    const updateConfig = vi.fn();
    const setup = integration!.hooks['astro:build:setup']!;
    const logger: Parameters<typeof setup>[0]['logger'] = {
      options: { level: 'silent', destination: { write: vi.fn() } },
      label: 'configuration fixture',
      fork: () => logger,
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      flush: vi.fn(),
      close: vi.fn(),
    };
    await setup({ updateConfig, vite: {}, pages: new Map(), target: 'client', logger });
    expect(updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ build: { modulePreload: false } }),
    );
    const group =
      updateConfig.mock.lastCall![0].environments.client.build.rolldownOptions.output.codeSplitting
        .groups[0];
    expect(group).toMatchObject({ name: 'shell', tags: ['$initial'], entriesAware: false });
    expect(group.test.test('/repo/src/lib/consent.ts')).toBe(true);
    expect(group.test.test('C:\\repo\\src\\lib\\page-position.ts')).toBe(true);
    expect(group.test.test('/repo/src/lib/photo-viewer.ts')).toBe(false);
    expect(group.test.test('/repo/src/scripts/site.ts')).toBe(false);
    const filter = dependencies.sitemap.mock.lastCall![0].filter;
    expect(filter('https://wcarsonmcrae.com/')).toBe(true);
    expect(filter('https://wcarsonmcrae.com/404/')).toBe(false);
    expect(filter('https://wcarsonmcrae.com/posts/ttsnative-started/')).toBe(false);
    expect(filter('https://wcarsonmcrae.com/posts/born/')).toBe(true);
  });
  it.each([
    [undefined, '/tmp/test-cert.pem', false],
    ['/tmp/test-key.pem', undefined, false],
    ['/tmp/test-key.pem', '/tmp/test-cert.pem', true],
  ])('loads loopback TLS only when both files are provided (%s, %s)', async (key, cert, paired) => {
    vi.stubEnv('E2E_TLS_KEY', key);
    vi.stubEnv('E2E_TLS_CERT', cert);
    vi.stubEnv('SITE_URL', 'https://example.test');
    vi.stubEnv('BASE_PATH', '/profile/');
    vi.stubEnv('PUBLIC_REACTIONS_URL', 'https://api.example.test');
    const { default: config } = await import('../../astro.config.mjs');
    expect(config).toMatchObject({
      site: 'https://example.test',
      base: '/profile',
      security: {
        csp: {
          directives: expect.arrayContaining(["connect-src 'self' https://api.example.test"]),
        },
      },
    });
    if (paired) {
      expect(dependencies.readFileSync.mock.calls).toEqual([[key], [cert]]);
      expect(config).toMatchObject({
        vite: { preview: { https: { key: expect.any(Buffer), cert: expect.any(Buffer) } } },
      });
    } else {
      expect(dependencies.readFileSync).not.toHaveBeenCalled();
      expect(config).toMatchObject({ vite: { preview: { strictPort: true } } });
    }
  });
});
