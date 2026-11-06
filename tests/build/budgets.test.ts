/**
 * Purpose: Performance budgets for the built site, so it stays fast as content grows.
 * Scope: HTML per page, the JavaScript and CSS each page loads, font payload, and every built image.
 * Constraints: When a budget fails, make the page lighter; never raise a budget to fit.
 * Does NOT belong: Size caps on committed source files (scripts/lib/asset-sizes.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, DIST, files, htmlPages, parse, sizeOf } from './dist';
import { scriptGraph } from './script-graph';

const KB = 1024;
const BUDGET = {
  html: 80 * KB,
  scriptPerPage: 20 * KB,
  stylePerPage: 60 * KB,
  fontsTotal: 160 * KB,
  image: 250 * KB,
};

function assetPath(url: string): string {
  return url.startsWith(BASE) ? url.slice(BASE.length) : url;
}

describe.each(htmlPages)('%s', (file) => {
  const document = parse(file);

  it('keeps its HTML, scripts, and styles within budget', () => {
    expect(sizeOf(file)).toBeLessThanOrEqual(BUDGET.html);
    const scripts = Array.from(document.querySelectorAll('script[src]'), (script) =>
      assetPath(script.getAttribute('src')!),
    );
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'), (script) =>
      Buffer.byteLength(script.textContent ?? ''),
    );
    const initial = [...scriptGraph(scripts)].map(sizeOf);
    expect([...initial, ...inlineScripts].reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(
      BUDGET.scriptPerPage,
    );
    // Traverse deferred edges too: every emitted dependency must exist, even before intent.
    expect(scriptGraph(scripts, true).size).toBeGreaterThanOrEqual(initial.length);
    const sheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'), (link) =>
      sizeOf(assetPath(link.getAttribute('href')!)),
    );
    const inlineStyles = Array.from(document.querySelectorAll('style'), (style) =>
      Buffer.byteLength(style.textContent ?? ''),
    );
    expect([...sheets, ...inlineStyles].reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(
      BUDGET.stylePerPage,
    );
  });
});

describe('assets', () => {
  it('does not inject JavaScript dependency-preload maps into deferred controls', () => {
    for (const file of files.filter((path) => path.endsWith('.js'))) {
      expect(readFileSync(join(DIST, file), 'utf8'), file).not.toContain('__vite__mapDeps');
    }
  });
  it('keeps the self-hosted fonts small', () => {
    const fonts = files.filter((file) => file.endsWith('.woff2'));
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.reduce((sum, file) => sum + sizeOf(file), 0)).toBeLessThanOrEqual(
      BUDGET.fontsTotal,
    );
  });

  it('keeps every built image within budget', () => {
    for (const image of files.filter((file) => /\.(?:png|jpe?g|webp|avif|svg)$/.test(file))) {
      expect(sizeOf(image), image).toBeLessThanOrEqual(BUDGET.image);
    }
  });
});
