/**
 * Purpose: Unit tests for src/lib/paths.ts.
 * Scope: External URL detection, base path handling, active navigation matching, and absolute URLs
 *   at the root and under a project path.
 * Does NOT belong: Deployment settings (tests/unit/deploy-config.test.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  isActivePath,
  isExternalUrl,
  normalizeBase,
  stripBase,
  withBase,
} from '../../src/lib/paths';

describe('isExternalUrl', () => {
  it.each([
    ['https://github.com/carsonmcrae', true],
    ['mailto:someone@example.com', true],
    ['//cdn.example.com/x.js', true],
    ['/about/', false],
    ['about/', false],
    ['#projects', false],
  ])('%s → %s', (href, expected) => {
    expect(isExternalUrl(href)).toBe(expected);
  });
});

describe('normalizeBase', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['/wcarsonmcrae', '/wcarsonmcrae/'],
    ['wcarsonmcrae/', '/wcarsonmcrae/'],
    ['//nested//', '/nested/'],
  ])('%j → %j', (base, expected) => {
    expect(normalizeBase(base)).toBe(expected);
  });
});

describe('withBase', () => {
  it('prefixes internal paths at the root', () => {
    expect(withBase('/about/', '/')).toBe('/about/');
    expect(withBase('/', '/')).toBe('/');
  });

  it('prefixes internal paths under a project base', () => {
    expect(withBase('/about/', '/wcarsonmcrae/')).toBe('/wcarsonmcrae/about/');
    expect(withBase('/', '/wcarsonmcrae')).toBe('/wcarsonmcrae/');
    expect(withBase('favicon.svg', '/wcarsonmcrae')).toBe('/wcarsonmcrae/favicon.svg');
  });

  it('leaves external URLs and anchors alone', () => {
    expect(withBase('https://ttsnative.com', '/repo/')).toBe('https://ttsnative.com');
    expect(withBase('#main', '/repo/')).toBe('#main');
  });

  it('uses the configured base by default', () => {
    expect(withBase('/work/')).toBe(`${normalizeBase(import.meta.env.BASE_URL)}work/`);
  });
});

describe('stripBase', () => {
  it('removes a project base', () => {
    expect(stripBase('/wcarsonmcrae/about/', '/wcarsonmcrae/')).toBe('/about/');
    expect(stripBase('/wcarsonmcrae/', '/wcarsonmcrae/')).toBe('/');
    expect(stripBase('/wcarsonmcrae', '/wcarsonmcrae/')).toBe('/');
  });

  it('returns other paths unchanged', () => {
    expect(stripBase('/about/', '/')).toBe('/about/');
    expect(stripBase('/elsewhere/', '/wcarsonmcrae/')).toBe('/elsewhere/');
    expect(stripBase('/life/')).toBe('/life/');
  });
});

describe('isActivePath', () => {
  it('matches the homepage only exactly', () => {
    expect(isActivePath('/', '/', '/')).toBe(true);
    expect(isActivePath('/about/', '/', '/')).toBe(false);
  });

  it('matches sections and their sub-pages', () => {
    expect(isActivePath('/work/', '/work/', '/')).toBe(true);
    expect(isActivePath('/work', '/work/', '/')).toBe(true);
    expect(isActivePath('/work/ttsnative/', '/work/', '/')).toBe(true);
    expect(isActivePath('/workshop/', '/work/', '/')).toBe(false);
  });

  it('accounts for the base path and anchors', () => {
    expect(isActivePath('/wcarsonmcrae/life/', '/life/', '/wcarsonmcrae/')).toBe(true);
    expect(isActivePath('/wcarsonmcrae/', '/', '/wcarsonmcrae/')).toBe(true);
    expect(isActivePath('/work/', '/work/#projects', '/')).toBe(true);
    expect(isActivePath('/', '#top', '/')).toBe(true);
  });

  it('never marks external links as active', () => {
    expect(isActivePath('/', 'https://github.com/carsonmcrae', '/')).toBe(false);
  });

  it('uses the configured base by default', () => {
    expect(isActivePath(`${normalizeBase(import.meta.env.BASE_URL)}about/`, '/about/')).toBe(true);
  });
});

describe('absoluteUrl', () => {
  it('builds canonical URLs for the custom domain', () => {
    expect(absoluteUrl('/about/', 'https://wcarsonmcrae.com', '/')).toBe(
      'https://wcarsonmcrae.com/about/',
    );
  });

  it('builds canonical URLs for a GitHub Pages project site', () => {
    expect(absoluteUrl('/og-image.png', 'https://carsonmcrae.github.io', '/wcarsonmcrae')).toBe(
      'https://carsonmcrae.github.io/wcarsonmcrae/og-image.png',
    );
  });

  it('returns external URLs unchanged', () => {
    expect(absoluteUrl('https://ttsnative.com', 'https://wcarsonmcrae.com', '/')).toBe(
      'https://ttsnative.com',
    );
  });

  it('uses the configured base by default', () => {
    expect(absoluteUrl('/', 'https://wcarsonmcrae.com')).toBe(
      new URL(normalizeBase(import.meta.env.BASE_URL), 'https://wcarsonmcrae.com').href,
    );
  });
});
