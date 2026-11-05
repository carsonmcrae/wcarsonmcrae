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
import { reactionOrigin } from './src/lib/reaction-api.ts';
import { readFileSync } from 'node:fs';
import { postAliases } from './src/data/post-aliases.ts';

const { site, base } = resolveDeployConfig(process.env);

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // Browser tests use HTTPS so WebKit can exercise the unchanged production CSP.
  vite: {
    preview: {
      strictPort: true,
      ...(process.env['E2E_TLS_KEY'] && process.env['E2E_TLS_CERT']
        ? {
            https: {
              key: readFileSync(process.env['E2E_TLS_KEY']),
              cert: readFileSync(process.env['E2E_TLS_CERT']),
            },
          }
        : {}),
    },
  },
  markdown: { syntaxHighlight: false },
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/404\/?$/.test(page) &&
        !Object.keys(postAliases).some((id) => page.endsWith(`/posts/${id}/`)),
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
        `connect-src 'self' ${reactionOrigin(process.env['PUBLIC_REACTIONS_URL'])}`,
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
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
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
