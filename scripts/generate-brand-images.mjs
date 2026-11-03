#!/usr/bin/env node
/**
 * Purpose: Command-line entry that generates the site's icons and social preview image
 *   (npm run images:brand).
 * Scope: Writes favicon.svg (pure geometry, no fonts), rasterizes the PNG icons from it with sharp,
 *   writes the web manifest, and renders og-image.png in Chromium so it uses the site's real
 *   typeface. Outputs are committed, so this runs only when the brand changes.
 * Does NOT belong: Page metadata (src/lib/seo.ts) or photo processing (scripts/strip-image-metadata.ts).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const INK = '#1b1d20';
const BLUE = '#1a55c0';

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${BLUE}"/>
  <path d="M18.9 10.8a6.8 6.8 0 1 0 0 10.4" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  <circle cx="24.4" cy="21.4" r="2.2" fill="#ffffff"/>
</svg>
`;

async function writePng(svg, size, file) {
  const png = await sharp(Buffer.from(svg), { density: 72 * (size / 32) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(publicDir, file), png);
}

async function renderOgImage() {
  // Fonts are inlined as data URLs: a page created with setContent cannot load file:// URLs.
  const fontData = {};
  for (const [key, path] of Object.entries({
    sans: '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
  })) {
    const buffer = await readFile(join(root, 'node_modules', path));
    fontData[key] = `data:font/woff2;base64,${buffer.toString('base64')}`;
  }
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Atkinson; src: url('${fontData.sans}'); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; padding: 88px 96px; background: #ffffff; color: ${INK};
  font-family: Atkinson, sans-serif; display: flex; flex-direction: column; }
h1 { font-size: 64px; font-weight: 750; line-height: 1.12; letter-spacing: -0.01em; max-width: 960px; }
p { font-size: 30px; line-height: 1.45; color: #555b63; max-width: 900px; margin-top: 28px; }
.url { margin-top: auto; font-size: 28px; color: ${BLUE}; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
</style></head><body>
<h1>Hey, I’m Carson. I help teams build complicated things, then go home and build more things.</h1>
<p>Technical program and product leader in Nashville. Builder of software on nights and weekends.</p>
<span class="url">wcarsonmcrae.com</span>
</body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const families = ['750 64px Atkinson', '400 30px Atkinson'];
      const loaded = await Promise.all(families.map((font) => document.fonts.load(font)));
      if (loaded.some((faces) => faces.length === 0)) throw new Error('Brand fonts failed to load');
    });
    const shot = await page.screenshot({ type: 'png' });
    const optimized = await sharp(shot)
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toBuffer();
    await writeFile(join(publicDir, 'og-image.png'), optimized);
  } finally {
    await browser.close();
  }
}

const manifest = {
  name: 'Carson McRae',
  short_name: 'Carson McRae',
  description:
    'Technical program and product leader in Nashville. Builder of software on the side.',
  start_url: '.',
  display: 'browser',
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};

await writeFile(join(publicDir, 'favicon.svg'), faviconSvg);
await writePng(faviconSvg, 32, 'favicon-32.png');
await writePng(faviconSvg, 180, 'apple-touch-icon.png');
await writePng(faviconSvg, 192, 'icon-192.png');
await writePng(faviconSvg, 512, 'icon-512.png');
await writeFile(join(publicDir, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
await renderOgImage();

const written = [
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
  'og-image.png',
];
for (const file of written) {
  const { size } = await readFile(join(publicDir, file)).then((buffer) => ({
    size: buffer.length,
  }));
  console.info(`public/${file}  ${(size / 1024).toFixed(1)} KB`);
}
