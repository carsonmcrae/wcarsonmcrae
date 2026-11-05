/**
 * Purpose: Shared helpers for the checks that run against the built site.
 * Scope: Locating the build output (DIST_DIR, default dist/), the expected origin and base path
 *   (from SITE_URL and BASE_PATH, like the build), listing pages, parsing HTML, and resolving an
 *   internal URL to the file GitHub Pages would serve for it.
 * Does NOT belong: Assertions (the *.test.ts files beside it).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Window } from 'happy-dom';
import { resolveDeployConfig } from '../../src/lib/deploy-config';
import { walk } from '../support/walk';

const ROOT = join(import.meta.dirname, '..', '..');
export const DIST = join(ROOT, process.env['DIST_DIR'] ?? 'dist');
const deploy = resolveDeployConfig(process.env);
export const SITE = deploy.site;
/** The base as it appears in URLs: "/" or "/wcarsonmcrae/". */
export const BASE = deploy.base === '/' ? '/' : `${deploy.base}/`;

export const files = existsSync(DIST)
  ? walk(DIST).map((file) => relative(DIST, file).replaceAll('\\', '/'))
  : [];
export const htmlPages = files
  .filter((file) => file.endsWith('.html'))
  .sort((a, b) => Number(a > b) - Number(a < b));

/** The URL path a built HTML file is served at, including the base. */
export function urlPathFor(file: string): string {
  if (file === '404.html') {
    return `${BASE}404.html`;
  }
  return `${BASE}${file.replace(/index\.html$/, '')}`;
}

export function parse(file: string): Document {
  const window = new Window({ url: `${SITE}${urlPathFor(file)}` });
  const document = new window.DOMParser().parseFromString(
    readFileSync(join(DIST, file), 'utf8'),
    'text/html',
  );
  return document as unknown as Document;
}

/** The file GitHub Pages serves for an internal URL path, or null when there is none. */
export function resolveInternal(pathname: string): string | null {
  if (!pathname.startsWith(BASE)) {
    return null;
  }
  const inside = decodeURIComponent(pathname.slice(BASE.length));
  const candidates =
    inside === '' || inside.endsWith('/')
      ? [`${inside}index.html`]
      : [inside, `${inside}/index.html`];
  return candidates.find((candidate) => files.includes(candidate)) ?? null;
}

export function sizeOf(file: string): number {
  return statSync(join(DIST, file)).size;
}
