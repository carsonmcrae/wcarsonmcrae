/**
 * Purpose: Caps the size of binary and media files committed to the repository.
 * Scope: Files in public/ are served as-is, so each stays under 256 KB; source images in
 *   src/assets/ are optimized at build time but still live in Git history, so each stays under
 *   1.5 MB. Reports every file over its cap.
 * Constraints: Shrink or re-export an oversized image (npm run images:strip re-encodes photos);
 *   never raise a cap to make a file fit.
 * Does NOT belong: Text line limits (scripts/lib/file-lines.ts) or the built-page budgets
 *   (tests/build/budgets.test.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { GateReport } from './file-lines.ts';

export const KB = 1024;

const ASSET_LIMITS: { pattern: RegExp; maxBytes: number; label: string }[] = [
  { pattern: /^public\//, maxBytes: 256 * KB, label: 'public/ file' },
  { pattern: /^src\/assets\//, maxBytes: 1536 * KB, label: 'source image' },
];

export interface FileSize {
  path: string;
  bytes: number;
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * KB
    ? `${(bytes / (1024 * KB)).toFixed(1)} MB`
    : `${Math.round(bytes / KB)} KB`;
}

export function checkAssetSizes(files: FileSize[]): GateReport {
  const report: GateReport = { checked: 0, errors: [], warnings: [] };
  for (const file of files) {
    const limit = ASSET_LIMITS.find((entry) => entry.pattern.test(file.path));
    if (!limit) {
      continue;
    }
    report.checked += 1;
    if (file.bytes > limit.maxBytes) {
      report.errors.push(
        `${file.path}: ${formatBytes(file.bytes)} exceeds the ${formatBytes(limit.maxBytes)} cap for a ${limit.label}.`,
      );
    }
  }
  return report;
}
