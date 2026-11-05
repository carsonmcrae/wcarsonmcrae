/**
 * Purpose: Unit tests for src/lib/seo.ts.
 * Scope: Titles, canonical and social tags at the root and under a project path, Person data, and
 *   safe JSON-LD.
 * Does NOT belong: Checks on the built pages' tags (tests/build).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd, buildSeo, formatTitle, serializeJsonLd } from '../../src/lib/seo';

const baseInput = {
  description: 'A description.',
  siteName: 'Carson McRae',
  defaultTitle: 'Carson McRae · Technical Program & Product Leader',
  site: 'https://wcarsonmcrae.com',
  base: '/',
  image: '/og-image.png',
  imageAlt: 'Preview',
  locale: 'en_US',
};

describe('formatTitle', () => {
  it('uses the default title on the homepage', () => {
    expect(formatTitle(undefined, 'Carson McRae', 'Default')).toBe('Default');
  });

  it('appends the site name to page titles', () => {
    expect(formatTitle('About', 'Carson McRae', 'Default')).toBe('About · Carson McRae');
  });
});

describe('buildSeo', () => {
  it('describes the homepage as a profile with absolute URLs', () => {
    const seo = buildSeo({ ...baseInput, title: undefined, path: '/' });
    expect(seo.title).toBe(baseInput.defaultTitle);
    expect(seo.canonical).toBe('https://wcarsonmcrae.com/');
    expect(seo.image).toBe('https://wcarsonmcrae.com/og-image.png');
    expect(seo.openGraph['og:type']).toBe('profile');
    expect(seo.openGraph['og:url']).toBe(seo.canonical);
    expect(seo.twitter['twitter:card']).toBe('summary_large_image');
  });

  it('builds page metadata under a project base path', () => {
    const seo = buildSeo({
      ...baseInput,
      title: 'Work',
      path: '/work/',
      site: 'https://carsonmcrae.github.io',
      base: '/wcarsonmcrae/',
    });
    expect(seo.title).toBe('Work · Carson McRae');
    expect(seo.canonical).toBe('https://carsonmcrae.github.io/wcarsonmcrae/work/');
    expect(seo.image).toBe('https://carsonmcrae.github.io/wcarsonmcrae/og-image.png');
    expect(seo.openGraph['og:type']).toBe('website');
    expect(seo.twitter['twitter:image:alt']).toBe('Preview');
  });
});

describe('buildPersonJsonLd', () => {
  it('produces schema.org Person data', () => {
    const data = buildPersonJsonLd({
      name: 'Carson McRae',
      fullName: 'William Carson McRae',
      headline: 'Technical Program & Product Leader',
      employer: 'Booz Allen Hamilton',
      locality: 'Nashville',
      region: 'TN',
      school: 'Vanderbilt University',
      url: 'https://wcarsonmcrae.com/',
      image: 'https://wcarsonmcrae.com/og-image.png',
      sameAs: ['https://github.com/carsonmcrae'],
    });
    expect(data).toMatchObject({
      '@type': 'Person',
      name: 'Carson McRae',
      alternateName: 'William Carson McRae',
      worksFor: { name: 'Booz Allen Hamilton' },
      alumniOf: { name: 'Vanderbilt University' },
      sameAs: ['https://github.com/carsonmcrae'],
    });
  });
});

describe('serializeJsonLd', () => {
  it('cannot break out of the script element', () => {
    expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('<');
  });
});
