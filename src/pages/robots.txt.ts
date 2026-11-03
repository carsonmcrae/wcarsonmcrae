/**
 * Purpose: Generates /robots.txt.
 * Scope: Allows every crawler and points it at the sitemap at the published address (custom
 *   domain or GitHub Pages project path).
 * Does NOT belong: The sitemap itself (@astrojs/sitemap in astro.config.mjs).
 */
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/paths';

export const GET: APIRoute = ({ site }) => {
  const sitemap = absoluteUrl('/sitemap-index.xml', site?.origin ?? 'https://wcarsonmcrae.com');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
