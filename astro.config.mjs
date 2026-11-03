// @ts-check
/**
 * Purpose: Astro configuration for the static site.
 * Scope: Site origin and base path (from src/lib/deploy-config.ts), trailing slashes, directory
 *   output, the sitemap, the Content-Security-Policy, and the self-hosted fonts.
 * Does NOT belong: Deployment (.github/workflows/deploy.yml), page content (src/data), or styles
 *   (src/styles).
 */
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { resolveDeployConfig } from './src/lib/deploy-config.ts';

const { site, base } = resolveDeployConfig(process.env);

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
    }),
  ],
  security: {
    // Astro hashes every bundled script and style and emits a strict
    // Content-Security-Policy <meta> tag on each page.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
    },
  },
  fonts: [
    {
      // Atkinson Hyperlegible Next: the Braille Institute's typeface for low-vision readers.
      provider: fontProviders.local(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: [
              '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
            ],
            weight: '200 800',
            style: 'normal',
          },
          {
            src: [
              '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-italic.woff2',
            ],
            weight: '200 800',
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Atkinson Hyperlegible Mono',
      cssVariable: '--font-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          {
            src: [
              '@fontsource-variable/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-wght-normal.woff2',
            ],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
  ],
  devToolbar: {
    enabled: false,
  },
});
