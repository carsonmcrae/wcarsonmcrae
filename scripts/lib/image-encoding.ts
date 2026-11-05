/**
 * Purpose: Chooses how a photo is re-encoded when its metadata is stripped.
 * Scope: Maps a file extension to the sharp output format and quality used by
 *   scripts/strip-image-metadata.ts, and lists which extensions count as photos.
 * Does NOT belong: File system access or running sharp (scripts/strip-image-metadata.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */

const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as const;

export type Encoding =
  | { format: 'jpeg'; options: { quality: number; mozjpeg: boolean } }
  | { format: 'png'; options: { compressionLevel: number } }
  | { format: 'webp'; options: { quality: number } }
  | { format: 'avif'; options: { quality: number } };

export function isPhoto(path: string): boolean {
  const lower = path.toLowerCase();
  return PHOTO_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function encodingFor(path: string): Encoding {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) {
    return { format: 'png', options: { compressionLevel: 9 } };
  }
  if (lower.endsWith('.webp')) {
    return { format: 'webp', options: { quality: 90 } };
  }
  if (lower.endsWith('.avif')) {
    return { format: 'avif', options: { quality: 70 } };
  }
  return { format: 'jpeg', options: { quality: 90, mozjpeg: true } };
}
