/**
 * Purpose: Checks every built page for the metadata, structure, and links GitHub Pages will serve.
 * Scope: Titles, descriptions, canonical and social tags against the expected origin and base,
 *   language, one h1 and ordered headings, landmarks and the skip link, image alternatives, the
 *   Content-Security-Policy, zoom not disabled, unique ids, and every internal link, asset, and
 *   fragment resolving to something that exists.
 * Does NOT belong: Size budgets (budgets.test.ts) or browser behavior (tests/e2e).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BASE, htmlPages, parse, resolveInternal, SITE, urlPathFor } from './dist';

const pages = htmlPages.map((file) => ({ file, document: parse(file) }));
const meta = (document: Document, key: string) =>
  document.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.getAttribute('content') ??
  '';

describe('the build', () => {
  it('produced every page', () => {
    for (const file of [
      'index.html',
      'about/index.html',
      'work/index.html',
      'life/index.html',
      'contact/index.html',
      'accessibility/index.html',
      '404.html',
    ]) {
      expect(htmlPages, file).toContain(file);
    }
  });
});

describe.each(pages)('$file', ({ file, document }) => {
  const isErrorPage = file === '404.html';

  it('has a unique title, a useful description, and English as its language', () => {
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.title.length).toBeGreaterThan(5);
    const description = meta(document, 'description');
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(170);
    const others = pages.filter((page) => page.file !== file);
    expect(others.map((page) => page.document.title)).not.toContain(document.title);
  });

  it('points canonical and social tags at the published address', () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const expected = `${SITE}${urlPathFor(file)}`;
    expect(canonical).toBe(expected);
    expect(meta(document, 'og:url')).toBe(canonical);
    expect(meta(document, 'og:image')).toBe(`${SITE}${BASE}og-image.png`);
    expect(meta(document, 'twitter:card')).toBe('summary_large_image');
    expect(meta(document, 'og:image:alt').length).toBeGreaterThan(10);
  });

  it('keeps search engines away from the error page only', () => {
    expect(meta(document, 'robots').includes('noindex')).toBe(isErrorPage);
  });

  it('allows zoom and ships a strict Content-Security-Policy', () => {
    const viewport = meta(document, 'viewport');
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i);
    const csp =
      document
        .querySelector('meta[http-equiv="content-security-policy"]')
        ?.getAttribute('content') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-inline');
    expect(document.querySelectorAll('[style]').length).toBe(0);
    for (const script of document.querySelectorAll('script:not([src])')) {
      if (script.getAttribute('type') === 'application/ld+json') {
        continue;
      }
      const hash = createHash('sha256')
        .update(script.textContent ?? '')
        .digest('base64');
      expect(csp, 'every inline script is allowed by hash').toContain(`'sha256-${hash}'`);
    }
  });

  it('has one h1, ordered headings, landmarks, and a skip link', () => {
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    const levels = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'), (heading) =>
      Number(heading.tagName[1]),
    );
    levels.forEach((level, index) => {
      expect(level - (levels[index - 1] ?? 0), `heading ${index + 1}`).toBeLessThanOrEqual(1);
    });
    expect(document.querySelector('header')).not.toBeNull();
    expect(document.querySelector('main#main')).not.toBeNull();
    expect(document.querySelector('footer')).not.toBeNull();
    const skip = document.querySelector('body a');
    expect(skip?.getAttribute('href')).toBe('#main');
  });

  it('gives every image an alternative and every id a unique value', () => {
    for (const image of document.querySelectorAll('img')) {
      expect(image.hasAttribute('alt'), image.outerHTML).toBe(true);
    }
    for (const svg of document.querySelectorAll('svg')) {
      const decorative = svg.getAttribute('aria-hidden') === 'true';
      const labelled =
        svg.getAttribute('role') === 'img' && Boolean(svg.getAttribute('aria-label'));
      expect(decorative || labelled, svg.outerHTML.slice(0, 120)).toBe(true);
    }
    const ids = Array.from(document.querySelectorAll('[id]'), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only links to internal files that exist and external sites over https', () => {
    const urls = [
      ...Array.from(document.querySelectorAll('a[href], link[href]'), (element) =>
        element.getAttribute('href')!,
      ),
      ...Array.from(document.querySelectorAll('script[src], img[src]'), (element) =>
        element.getAttribute('src')!,
      ),
      ...Array.from(document.querySelectorAll('[srcset]'), (element) =>
        element
          .getAttribute('srcset')!
          .split(',')
          .map((entry) => entry.trim().split(/\s+/)[0]!),
      ).flat(),
    ];
    expect(urls.length).toBeGreaterThan(10);
    for (const raw of urls) {
      if (raw.startsWith('mailto:')) {
        continue;
      }
      const url = new URL(raw, `${SITE}${urlPathFor(file)}`);
      // Same-origin links outside the base path (for example the portfolio at
      // carsonmcrae.github.io) belong to another site, not this one.
      if (url.origin !== SITE || !url.pathname.startsWith(BASE)) {
        expect(url.protocol, raw).toBe('https:');
        continue;
      }
      const target = resolveInternal(url.pathname);
      expect(target, `${raw} from ${file}`).not.toBeNull();
      if (url.hash.length > 1 && target?.endsWith('.html')) {
        const targetDocument = target === file ? document : parse(target);
        expect(
          targetDocument.getElementById(decodeURIComponent(url.hash.slice(1))),
          `${raw} from ${file}`,
        ).not.toBeNull();
      }
    }
  });
});
