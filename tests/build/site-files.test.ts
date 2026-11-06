/**
 * Purpose: Checks the site-level files GitHub Pages serves beside the pages.
 * Scope: The sitemap (every page except the 404, at the published address), robots.txt pointing at
 *   it, the icons and web manifest, the social preview image, and no stray CNAME file (a custom
 *   Actions workflow ignores it; the domain lives in the repository's Pages settings).
 * Does NOT belong: Per-page checks (pages.test.ts) or size budgets (budgets.test.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE, DIST, files, htmlPages, parse, SITE, urlPathFor } from './dist';
import { postAliases } from '../../src/data/post-aliases';
import { releaseVersion } from '../../src/lib/release-identity';

const read = (file: string) => readFileSync(join(DIST, file), 'utf8');

describe('site files', () => {
  it('attributes every HTML document and the public build receipt to the same source', () => {
    const build = {
      version: releaseVersion,
      source: process.env['SOURCE_COMMIT']?.toLowerCase() ?? 'local',
    };
    expect(JSON.parse(read('build.json'))).toEqual(build);
    for (const page of htmlPages) {
      expect(
        parse(page).querySelector('meta[name="daysforth-build"]')?.getAttribute('content'),
        page,
      ).toBe(`${build.version}@${build.source}`);
    }
  });
  it('lists every public page in the sitemap at the published address', () => {
    expect(read('sitemap-index.xml')).toContain(`${SITE}${BASE}sitemap-0.xml`);
    const sitemap = read('sitemap-0.xml');
    for (const page of htmlPages.filter(
      (file) => file !== '404.html' && !postAliases[file.split('/')[1] ?? ''],
    )) {
      expect(sitemap, page).toContain(`<loc>${SITE}${urlPathFor(page)}</loc>`);
    }
    expect(sitemap).not.toContain('404');
    for (const alias of Object.keys(postAliases)) expect(sitemap).not.toContain(`/posts/${alias}/`);
  });

  it('points robots.txt at the sitemap', () => {
    const robots = read('robots.txt');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain(`Sitemap: ${SITE}${BASE}sitemap-index.xml`);
  });

  it('ships icons, a manifest, and the social preview image', () => {
    for (const file of [
      'favicon.svg',
      'favicon-16.png',
      'favicon-32.png',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'og-image.png',
      'site.webmanifest',
    ]) {
      expect(files, file).toContain(file);
    }
    const manifest = JSON.parse(read('site.webmanifest')) as { icons: { src: string }[] };
    for (const icon of manifest.icons) {
      expect(files, icon.src).toContain(icon.src);
    }
  });

  it('does not ship a CNAME file', () => {
    expect(files).not.toContain('CNAME');
  });
});
