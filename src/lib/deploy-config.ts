/**
 * Purpose: Resolves the deployment origin and base path so every generated URL is correct.
 * Scope: Validates SITE_URL and BASE_PATH: the custom domain (https://wcarsonmcrae.com at /), the
 *   GitHub Pages project URL (https://carsonmcrae.github.io under /wcarsonmcrae), or local
 *   defaults. The deploy workflow fills both from actions/configure-pages.
 * Does NOT belong: Building URLs for pages and assets (src/lib/paths.ts) or Astro configuration
 *   itself (astro.config.mjs).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export const DEFAULT_SITE_URL = 'https://wcarsonmcrae.com';

export interface DeployConfig {
  /** Absolute origin, without a trailing slash. */
  site: string;
  /** Path prefix starting with "/" and without a trailing slash, or "/" for the root. */
  base: string;
}

export function normalizeSiteUrl(value: string | undefined): string {
  const raw = value?.trim() || DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE_URL must be an absolute URL, received "${raw}"`);
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error(`SITE_URL must use https, received "${raw}"`);
  }
  if (url.username || url.password) throw new Error('SITE_URL must not contain credentials.');
  return url.origin;
}

export function normalizeBasePath(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  const segments = trimmed.split('/').filter(Boolean);
  if (segments.some((segment) => !/^[\w.-]+$/.test(segment) || /^\.+$/.test(segment))) {
    throw new Error(`BASE_PATH contains unsupported characters: "${trimmed}"`);
  }
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

export function resolveDeployConfig(env: Record<string, string | undefined>): DeployConfig {
  return {
    site: normalizeSiteUrl(env['SITE_URL']),
    base: normalizeBasePath(env['BASE_PATH']),
  };
}
