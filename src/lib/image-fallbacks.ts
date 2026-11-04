/**
 * Purpose: Browser-side recovery for images that fail to load.
 * Scope: Marks a failed picture’s frame so CSS can collapse it gracefully, without importing source assets.
 * Does NOT belong: Build-time image lookup (images.ts) or optimization.
 */
export function initImageFallbacks(root: ParentNode): number {
  let watched = 0;
  for (const image of root.querySelectorAll<HTMLImageElement>('img[data-fallback]')) {
    const frame = image.closest('[data-image-frame]');
    if (!frame) continue;
    const markFailed = () => frame.setAttribute('data-image-failed', '');
    if (image.complete && image.naturalWidth === 0 && image.getAttribute('src')) markFailed();
    else image.addEventListener('error', markFailed, { once: true });
    watched += 1;
  }
  return watched;
}
