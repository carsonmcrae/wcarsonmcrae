/**
 * Purpose: Plans how incoming photos become site assets.
 * Scope: Turns an original filename into a clean asset stem, picks the output format (JPEG for
 *   opaque photos, WebP when the image has transparency), decides the resize so the long edge is at
 *   most 2000 px, and checks a batch for duplicate stems.
 * Constraints: Pure functions only, so the plan is unit tested; the file system and sharp live in
 *   scripts/import-photos.ts.
 * Does NOT belong: Reading or writing files, or choosing which photo goes on which page (src/data).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */

export const MAX_EDGE = 2000;
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff'] as const;

export function isPhotoFile(name: string): boolean {
  const lower = name.toLowerCase();
  return PHOTO_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** "Nicole_Carson_B&W_1.jpg" becomes "nicole-carson-b-w-1". */
export function toStem(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-');
  return slug || 'photo';
}

export interface SourceInfo {
  name: string;
  width: number;
  height: number;
  hasAlpha: boolean;
}

export interface ImportStep {
  source: string;
  stem: string;
  output: string;
  format: 'jpeg' | 'webp';
  options: { quality: number; mozjpeg?: boolean };
  resize: { width: number; height: number } | null;
}

export function resizeFor(width: number, height: number): ImportStep['resize'] {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_EDGE) {
    return null;
  }
  const scale = MAX_EDGE / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function planImport(source: SourceInfo): ImportStep {
  const stem = toStem(source.name);
  const format = source.hasAlpha ? 'webp' : 'jpeg';
  return {
    source: source.name,
    stem,
    output: `${stem}.${format === 'jpeg' ? 'jpg' : 'webp'}`,
    format,
    options: format === 'jpeg' ? { quality: 85, mozjpeg: true } : { quality: 90 },
    resize: resizeFor(source.width, source.height),
  };
}

/** Returns the stems that more than one source would produce, so nothing is silently overwritten. */
export function findCollisions(steps: ImportStep[]): string[] {
  const seen = new Map<string, number>();
  for (const step of steps) {
    seen.set(step.stem, (seen.get(step.stem) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([stem]) => stem);
}
