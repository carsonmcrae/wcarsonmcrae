/**
 * Purpose: Verify the real generated metadata/style/icon endpoints delivered by the static site.
 * Scope: Safe response types, crawler origin defaults, approved date rules, and trusted sprite markup.
 * Does NOT belong: Calling production URLs or duplicating browser interaction tests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { GET as iconSprite } from '../../src/pages/icons.svg';
import { GET as robots } from '../../src/pages/robots.txt';
import { GET as timelineStyles } from '../../src/pages/timeline-positions.css';

describe('published static endpoints', () => {
  it('serves trusted icon symbols without scripts or foreign content', async () => {
    const response = iconSprite();
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    const markup = await response.text();
    expect(markup).toContain('id="icon-heart"');
    expect(markup).toContain('viewBox="0 0 256 256"');
    expect(markup).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg">/);
    expect(markup).not.toMatch(/<script|foreignObject|onload\s*=/i);
  });
  it('points crawlers at the canonical or explicitly configured host', async () => {
    for (const [site, host] of [
      [undefined, 'https://wcarsonmcrae.com'],
      [new URL('https://example.test/'), 'https://example.test'],
    ] as const) {
      const response = await robots({ site } as Parameters<typeof robots>[0]);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(await response.text()).toBe(
        `User-agent: *\nAllow: /\n\nSitemap: ${host}/sitemap-index.xml\n`,
      );
    }
  });
  it('publishes exactly the three approved proportional pin styles', async () => {
    const response = timelineStyles();
    expect(response.headers.get('Content-Type')).toBe('text/css; charset=utf-8');
    const css = await response.text();
    expect(css.match(/\.date-rail__label--\d/g)).toHaveLength(3);
    expect(css).toContain('.date-rail__label--0 { left: calc(0.00000%');
    expect(css).toContain('.date-rail__label--2');
    expect(css).not.toMatch(/@import|url\(/i);
  });
});
