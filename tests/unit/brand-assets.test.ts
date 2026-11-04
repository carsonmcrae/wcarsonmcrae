/**
 * Purpose: Integrity tests for the portable Daysforth brand exports.
 * Scope: Glyph positioning, approved mark fidelity, complete inventory, and export dimensions.
 * Does NOT belong: Subjective design approval or browser presentation.
 */
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { brand } from '../../src/data/brand';
import {
  brandVectors,
  brandRasterWidth,
  brandArchiveManifest,
  outlineWordmark,
} from '../../scripts/lib/brand-assets';
describe('Daysforth brand kit', () => {
  it('uses font advance and offset metrics so outlines retain kerning and baseline', () => {
    const outline = outlineWordmark(
      {
        unitsPerEm: 1000,
        layout: () => ({
          glyphs: [{ path: { toSVG: () => 'M0 0L1 1Z' } }, { path: { toSVG: () => 'M2 2L3 3Z' } }],
          positions: [
            { xAdvance: 600, xOffset: 20, yOffset: 10 },
            { xAdvance: 400, xOffset: -20, yOffset: 0 },
          ],
        }),
      },
      'Df',
      50,
    );
    expect(outline.width).toBe(50);
    expect(outline.paths).toContain('translate(1.000 -0.500)');
    expect(outline.paths).toContain('translate(29.000 0.000)');
    expect(outline.paths).toContain('scale(0.050000 -0.050000)');
    expect(outline.paths).not.toContain('<text');
  });
  it('exports the complete inventory with coherent color and portable logo lettering', () => {
    const outline = { paths: '<path d="M0 0L1 1Z"/>', width: 240 };
    const vectors = brandVectors(outline, outline, outline);
    expect(Object.keys(vectors)).toHaveLength(13);
    for (const asset of brand.downloads)
      expect(vectors[asset.file]).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(vectors['daysforth-mark.svg']).toContain('viewBox="0 0 64 64"');
    expect(vectors['daysforth-mark.svg']).toContain(brand.colors[0]!.hex);
    expect(vectors['daysforth-lockup-reversed.svg']).toContain('fill="#ffffff"');
    expect(vectors['daysforth-lockup-mono.svg']).toContain('fill="#111318"');
    expect(vectors['daysforth-wordmark.svg']).not.toContain('<text');
    expect(vectors['daysforth-social.svg']).toContain('viewBox="0 0 1200 630"');
    expect(vectors['daysforth-banner.svg']).toContain('viewBox="0 0 1500 500"');
    expect(vectors['daysforth-social.svg']).not.toContain('<text');
    expect(brandRasterWidth('daysforth-mark.svg')).toBe(512);
    expect(brandRasterWidth('daysforth-mark-small.svg')).toBe(24);
    expect(brandRasterWidth('daysforth-banner.svg')).toBe(1500);
    expect(brandRasterWidth('daysforth-stacked.svg')).toBe(720);
    expect(brandRasterWidth('daysforth-social.svg')).toBe(1200);
    const archive = brandArchiveManifest(Object.keys(vectors), ['icon-192.png', 'icon-512.png']);
    expect(archive).toHaveLength(33);
    expect(archive).toContainEqual(['FONT-LICENSE.txt', 'brand/FONT-LICENSE.txt']);
    expect(archive).toContainEqual(['icon-512.png', 'icon-512.png']);
    expect(archive).toContainEqual(['daysforth-lockup.png', 'brand/daysforth-lockup.png']);
  });
  it.each([
    ['daysforth-mark.svg', 'daysforth-logo-main.svg'],
    ['daysforth-mark-small.svg', 'daysforth-logo-small.svg'],
  ])('renders %s exactly like its approved artwork', async (asset, reference) => {
    const outline = { paths: '', width: 240 };
    const approved = await readFile(
      new URL(`../../docs/wireframes/approved/${reference}`, import.meta.url),
    );
    const actual = brandVectors(outline, outline, outline)[asset]!;
    const render = (svg: string | Buffer) => sharp(Buffer.from(svg)).resize(256).raw().toBuffer();
    expect(await render(actual)).toEqual(await render(approved));
  });
});
