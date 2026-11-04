#!/usr/bin/env node
/**
 * Purpose: Exports the original Daysforth brand kit and production icons.
 * Scope: Exports both approved mark sizes, outlines the wordmark, renders PNGs, and packages the kit.
 * Does NOT belong: Vector construction (scripts/lib/brand-assets.ts) or photo processing.
 */
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSync } from 'fontkit';
import sharp from 'sharp';
import { zipSync } from 'fflate';
import {
  brandVectors,
  brandRasterWidth,
  brandArchiveManifest,
  outlineWordmark,
} from './lib/brand-assets.ts';
import { brand } from '../src/data/brand.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');
const kit = join(publicDir, 'brand');
await mkdir(kit, { recursive: true });
const fontPath = join(
  root,
  'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
);
const font = openSync(join(root, 'src/assets/fonts/InterVariable.ttf')).getVariation({ wght: 760 });
const vectors = brandVectors(
  outlineWordmark(font, brand.name, 48),
  outlineWordmark(font, brand.tagline, 56),
  outlineWordmark(font, brand.domain, 24),
);
for (const [name, svg] of Object.entries(vectors)) {
  await writeFile(join(kit, name), svg);
  await sharp(Buffer.from(svg))
    .resize({ width: brandRasterWidth(name), withoutEnlargement: false })
    .png({ palette: true, colours: 128, compressionLevel: 9 })
    .toFile(join(kit, name.replace('.svg', '.png')));
}
const mark = vectors['daysforth-mark.svg'];
const smallMark = vectors['daysforth-mark-small.svg'];
await writeFile(join(publicDir, 'favicon.svg'), smallMark);
const icons = [
  ['favicon-16.png', 16, smallMark],
  ['favicon-32.png', 32, smallMark],
  ['apple-touch-icon.png', 180, mark],
  ['icon-192.png', 192, mark],
  ['icon-512.png', 512, mark],
];
for (const [name, size, vector] of icons) {
  await sharp(Buffer.from(vector), { density: (72 * size) / 64 })
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
}
await copyFile(join(kit, 'daysforth-social.png'), join(publicDir, 'og-image.png'));
await copyFile(fontPath, join(kit, 'Inter-variable-latin.woff2'));
await copyFile(
  join(root, 'node_modules/@fontsource-variable/inter/LICENSE'),
  join(kit, 'FONT-LICENSE.txt'),
);
await writeFile(
  join(publicDir, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Daysforth — Carson McRae',
      short_name: 'Daysforth',
      description: 'Your life, as it unfolds.',
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1746ff',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    null,
    2,
  ) + '\n',
);
const license = await readFile(join(root, 'node_modules/@phosphor-icons/core/LICENSE'), 'utf8');
await writeFile(join(kit, 'ICON-LICENSE.txt'), license);
const entries = await Promise.all(
  brandArchiveManifest(Object.keys(vectors), ['favicon.svg', ...icons.map(([name]) => name)]).map(
    async ([name, source]) => [name, new Uint8Array(await readFile(join(publicDir, source)))],
  ),
);
await writeFile(
  join(kit, 'daysforth-brand-kit.zip'),
  zipSync(Object.fromEntries(entries), { level: 9, mtime: new Date('2026-11-04T00:00:00Z') }),
);
console.info(
  `Exported ${Object.keys(vectors).length} vector originals, PNG versions, app icons, and font licensing.`,
);
