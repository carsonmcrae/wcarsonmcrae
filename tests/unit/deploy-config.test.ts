/**
 * Purpose: Unit tests for src/lib/deploy-config.ts.
 * Scope: SITE_URL and BASE_PATH validation for the custom domain, the GitHub Pages project URL,
 *   and local defaults.
 * Does NOT belong: URL building (tests/unit/paths.test.ts).
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SITE_URL,
  normalizeBasePath,
  normalizeSiteUrl,
  resolveDeployConfig,
} from '../../src/lib/deploy-config';

describe('normalizeSiteUrl', () => {
  it('defaults to the custom domain', () => {
    expect(DEFAULT_SITE_URL).toBe('https://wcarsonmcrae.com');
    expect(normalizeSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl('   ')).toBe(DEFAULT_SITE_URL);
  });

  it('keeps only the origin', () => {
    expect(normalizeSiteUrl('https://carsonmcrae.github.io/')).toBe(
      'https://carsonmcrae.github.io',
    );
    expect(normalizeSiteUrl('https://wcarsonmcrae.com/some/path')).toBe('https://wcarsonmcrae.com');
  });

  it('allows http only for localhost', () => {
    expect(normalizeSiteUrl('http://localhost:4321')).toBe('http://localhost:4321');
    expect(() => normalizeSiteUrl('http://wcarsonmcrae.com')).toThrow(/https/);
    expect(() => normalizeSiteUrl('ftp://localhost')).toThrow(/https/);
    expect(() => normalizeSiteUrl('https://user@example.com')).toThrow(/credentials/);
    expect(() => normalizeSiteUrl('https://:password@example.com')).toThrow(/credentials/);
  });

  it('rejects values that are not absolute URLs', () => {
    expect(() => normalizeSiteUrl('wcarsonmcrae.com')).toThrow(/absolute URL/);
  });
});

describe('normalizeBasePath', () => {
  it('treats empty values as the root', () => {
    expect(normalizeBasePath(undefined)).toBe('/');
    expect(normalizeBasePath('')).toBe('/');
    expect(normalizeBasePath('/')).toBe('/');
  });

  it('normalizes GitHub Pages project paths', () => {
    expect(normalizeBasePath('/wcarsonmcrae')).toBe('/wcarsonmcrae');
    expect(normalizeBasePath('wcarsonmcrae/')).toBe('/wcarsonmcrae');
    expect(normalizeBasePath(' /a/b/ ')).toBe('/a/b');
  });

  it('rejects traversal and unexpected characters', () => {
    expect(() => normalizeBasePath('/../etc')).toThrow(/unsupported/);
    expect(() => normalizeBasePath('/has space')).toThrow(/unsupported/);
  });
});

describe('resolveDeployConfig', () => {
  it('combines both settings', () => {
    expect(
      resolveDeployConfig({
        SITE_URL: 'https://carsonmcrae.github.io',
        BASE_PATH: '/wcarsonmcrae',
      }),
    ).toEqual({ site: 'https://carsonmcrae.github.io', base: '/wcarsonmcrae' });
    expect(resolveDeployConfig({})).toEqual({ site: DEFAULT_SITE_URL, base: '/' });
  });
});
