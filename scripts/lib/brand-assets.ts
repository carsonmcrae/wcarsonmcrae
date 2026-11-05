/**
 * Purpose: Portable vector construction for the original Daysforth identity.
 * Scope: The approved main and small D marks, outlined font paths, lockups, and social templates.
 * Does NOT belong: File IO or raster export (scripts/generate-brand-images.mjs).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { brand } from '../../src/data/brand.ts';
interface OutlineFont {
  unitsPerEm: number;
  layout(text: string): {
    glyphs: { path: { toSVG(): string } }[];
    positions: { xAdvance: number; xOffset: number; yOffset: number }[];
  };
}
export interface WordmarkOutline {
  paths: string;
  width: number;
}
export function outlineWordmark(font: OutlineFont, text: string, size: number): WordmarkOutline {
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  let advance = 0;
  const paths = run.glyphs
    .map((glyph, index) => {
      const position = run.positions[index]!;
      const path = `<path d="${glyph.path.toSVG().replaceAll(' ', ',')}" transform="translate(${((advance + position.xOffset) * scale).toFixed(3)} ${(-position.yOffset * scale).toFixed(3)}) scale(${scale.toFixed(6)} ${(-scale).toFixed(6)})"/>`;
      advance += position.xAdvance;
      return path;
    })
    .join('\n');
  return { paths, width: Math.ceil(advance * scale) };
}
function svgDocument(content: string, width: number, height: number, title: string): string {
  return `<!-- Purpose: ${title}. Scope: Original Daysforth brand artwork. Does NOT belong: UI behavior. -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">\n${content}\n</svg>\n`;
}
const MAIN_MARK_PATH =
  'M13 11H31C46 11 54 20 54 32S46 53 31 53H13Q9 53 9 49V15Q9 11 13 11Z M27 22V42H31C39 42 44 38 44 32S39 22 31 22Z M18 15.5A4.5 4.5 0 0 1 20 24.031128874149275V27.968871125850725A4.5 4.5 0 0 1 20 36.031128874149275V39.968871125850725A4.5 4.5 0 1 1 16 39.968871125850725V36.031128874149275A4.5 4.5 0 0 1 16 27.968871125850725V24.031128874149275A4.5 4.5 0 0 1 18 15.5Z';
const SMALL_MARK_PATH =
  'M12 8H31C47 8 56 18 56 32S47 56 31 56H12Q8 56 8 52V12Q8 8 12 8Z M28 20V44H31C39 44 44 39 44 32S39 20 31 20Z M23 18a5 5 0 1 0 -10 0a5 5 0 1 0 10 0Z M23 32a5 5 0 1 0 -10 0a5 5 0 1 0 10 0Z M23 46a5 5 0 1 0 -10 0a5 5 0 1 0 10 0Z';
function markDrawing(background: string, foreground: string, small = false): string {
  const path = small ? SMALL_MARK_PATH : MAIN_MARK_PATH;
  return `<rect width="64" height="64" rx="16" fill="${background}"/>\n<path fill="${foreground}" fill-rule="evenodd" d="${path}"/>`;
}
export function brandVectors(
  wordmark: WordmarkOutline,
  tagline: WordmarkOutline,
  domain: WordmarkOutline,
): Record<string, string> {
  const blue = brand.colors[0]!.hex;
  const ink = brand.colors[1]!.hex;
  const mark = markDrawing(blue, '#ffffff');
  const width = wordmark.width + 88;
  const word = (color: string) =>
    `<g fill="${color}" transform="translate(84 49)">${wordmark.paths}</g>`;
  const social = (w: number, h: number, label: string) =>
    svgDocument(
      `<rect width="${w}" height="${h}" fill="#ffffff"/><g transform="translate(80 72)">${mark}<g fill="${ink}" transform="translate(84 49)">${wordmark.paths}</g></g><g fill="${ink}" transform="translate(80 ${h * 0.57})">${tagline.paths}</g><g fill="${blue}" transform="translate(80 ${h - 72})">${domain.paths}</g>`,
      w,
      h,
      label,
    );
  return {
    'daysforth-mark.svg': svgDocument(mark, 64, 64, 'Daysforth app mark'),
    'daysforth-mark-small.svg': svgDocument(
      markDrawing(blue, '#ffffff', true),
      64,
      64,
      'Daysforth small-size app mark',
    ),
    'daysforth-mark-small-mono.svg': svgDocument(
      markDrawing('none', ink, true),
      64,
      64,
      'Daysforth small-size monochrome mark',
    ),
    'daysforth-mark-small-white.svg': svgDocument(
      markDrawing('none', '#ffffff', true),
      64,
      64,
      'Daysforth small-size white mark',
    ),
    'daysforth-mark-mono.svg': svgDocument(
      markDrawing('none', ink),
      64,
      64,
      'Daysforth monochrome mark',
    ),
    'daysforth-mark-white.svg': svgDocument(
      markDrawing('none', '#ffffff'),
      64,
      64,
      'Daysforth white mark',
    ),
    'daysforth-lockup.svg': svgDocument(`${mark}${word(ink)}`, width, 64, 'Daysforth primary logo'),
    'daysforth-lockup-reversed.svg': svgDocument(
      `${mark}${word('#ffffff')}`,
      width,
      64,
      'Daysforth reversed logo',
    ),
    'daysforth-lockup-mono.svg': svgDocument(
      `${markDrawing('none', ink)}${word(ink)}`,
      width,
      64,
      'Daysforth monochrome logo',
    ),
    'daysforth-wordmark.svg': svgDocument(
      `<g fill="${ink}" transform="translate(0 49)">${wordmark.paths}</g>`,
      wordmark.width,
      64,
      'Daysforth outlined wordmark',
    ),
    'daysforth-stacked.svg': svgDocument(
      `<g transform="translate(${(wordmark.width - 64) / 2} 0)">${mark}</g><g fill="${ink}" transform="translate(0 129)">${wordmark.paths}</g>`,
      wordmark.width,
      144,
      'Daysforth stacked logo',
    ),
    'daysforth-social.svg': social(1200, 630, 'Daysforth social card'),
    'daysforth-banner.svg': social(1500, 500, 'Daysforth profile banner'),
  };
}

export function brandRasterWidth(name: string): number {
  if (name.startsWith('daysforth-mark-small')) return 24;
  if (name.startsWith('daysforth-mark')) return 512;
  if (name === 'daysforth-banner.svg') return 1500;
  if (name === 'daysforth-stacked.svg') return 720;
  return 1200;
}

export function brandArchiveManifest(vectors: string[], icons: string[]): [string, string][] {
  const originals = vectors.flatMap((name) => [name, name.replace('.svg', '.png')]);
  const support = [
    'README.md',
    'tokens.css',
    'Inter-variable-latin.woff2',
    'FONT-LICENSE.txt',
    'ICON-LICENSE.txt',
  ];
  return [...originals, ...support]
    .map((name): [string, string] => [name, `brand/${name}`])
    .concat(icons.map((name): [string, string] => [name, name]));
}
