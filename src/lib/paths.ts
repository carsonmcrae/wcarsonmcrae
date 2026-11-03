/**
 * Purpose: URL helpers that keep links working at the site root and under a GitHub Pages project
 *   path.
 * Scope: Detects external URLs, normalizes the base path, prefixes internal paths, strips the base
 *   for comparisons, decides active navigation links, and builds absolute URLs for canonical and
 *   social tags.
 * Does NOT belong: Deployment settings (src/lib/deploy-config.ts) or page metadata
 *   (src/lib/seo.ts).
 */
const EXTERNAL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** True for absolute URLs (`https:`, `mailto:`, protocol-relative, and so on). */
export function isExternalUrl(href: string): boolean {
  return EXTERNAL_PATTERN.test(href);
}

/** Normalizes a base like "", "/", "/repo", or "/repo/" to "/" or "/repo/". */
export function normalizeBase(base: string): string {
  const trimmed = base.split('/').filter(Boolean).join('/');
  return trimmed ? `/${trimmed}/` : '/';
}

/**
 * Prefixes an internal path with the deployment base. External URLs and
 * in-page anchors are returned unchanged.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (isExternalUrl(path) || path.startsWith('#')) {
    return path;
  }
  return `${normalizeBase(base)}${path.replace(/^\/+/, '')}`;
}

/** Removes the deployment base from a pathname, always returning a leading slash. */
export function stripBase(pathname: string, base: string = import.meta.env.BASE_URL): string {
  const normalized = normalizeBase(base);
  if (normalized !== '/' && pathname.startsWith(normalized)) {
    return `/${pathname.slice(normalized.length)}`;
  }
  if (normalized !== '/' && `${pathname}/` === normalized) {
    return '/';
  }
  return pathname;
}

function ensureTrailingSlash(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/**
 * Decides whether a navigation link represents the current page.
 * "/" only matches the homepage; other links also match their sub-pages.
 */
export function isActivePath(
  currentPathname: string,
  href: string,
  base: string = import.meta.env.BASE_URL,
): boolean {
  if (isExternalUrl(href)) {
    return false;
  }
  const current = ensureTrailingSlash(stripBase(currentPathname, base));
  const target = ensureTrailingSlash(href.split('#')[0] || '/');
  if (target === '/') {
    return current === '/';
  }
  return current.startsWith(target);
}

/** Builds an absolute URL for canonical tags, Open Graph, and the sitemap. */
export function absoluteUrl(
  path: string,
  site: string,
  base: string = import.meta.env.BASE_URL,
): string {
  if (isExternalUrl(path)) {
    return path;
  }
  return new URL(withBase(path, base), site).href;
}
