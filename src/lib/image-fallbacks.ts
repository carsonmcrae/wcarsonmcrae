/**
 * Purpose: Browser-side recovery for images that fail to load.
 * Scope: Marks a failed picture’s frame so CSS can collapse it gracefully, without importing source assets.
 * Does NOT belong: Build-time image lookup (images.ts) or optimization.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function initImageFallbacks(root: ParentNode): number {
  let watched = 0;
  for (const image of root.querySelectorAll<HTMLImageElement>('img[data-fallback]')) {
    const frame = image.closest<HTMLElement>('[data-image-frame]');
    if (!frame) continue;
    const markFailed = () => {
      frame.dataset['imageFailed'] = '';
    };
    if (image.complete && image.naturalWidth === 0 && image.getAttribute('src')) markFailed();
    else image.addEventListener('error', markFailed, { once: true });
    watched += 1;
  }
  return watched;
}
