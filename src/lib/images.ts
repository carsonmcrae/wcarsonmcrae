/**
 * Purpose: Finds optional images by filename and guards against images that fail to load.
 * Scope: Looks up photos in src/assets/photos/ and project art in src/assets/projects/ at build
 *   time, returning undefined when a file has not been added, and marks image frames whose image
 *   fails in the browser so CSS can show a fallback.
 * Does NOT belong: Image optimization (Astro's Picture and Image components) or stripping photo
 *   metadata (scripts/strip-image-metadata.ts).
 */
import type { ImageMetadata } from 'astro';

export type ImageModules = Record<string, { default: ImageMetadata }>;

export function fileStem(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
}

export function findImage(
  modules: ImageModules,
  name: string | null | undefined,
): ImageMetadata | undefined {
  if (!name) {
    return undefined;
  }
  const match = Object.entries(modules).find(([path]) => fileStem(path) === name);
  return match?.[1].default;
}

const photoModules: ImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/photos/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const projectModules: ImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/projects/*.{png,jpg,jpeg,webp,avif,svg}',
  { eager: true },
);

export const getPhoto = (name: string | null | undefined) => findImage(photoModules, name);
export const getProjectImage = (name: string | null | undefined) => findImage(projectModules, name);

export const availablePhotos = () => Object.keys(photoModules).map(fileStem);
export const availableProjectImages = () => Object.keys(projectModules).map(fileStem);

/**
 * Runtime safety net: if an image fails to load in the browser, mark its
 * frame so CSS can show the fallback instead of a broken-image icon.
 */
export function initImageFallbacks(root: ParentNode): number {
  let watched = 0;
  for (const image of root.querySelectorAll<HTMLImageElement>('img[data-fallback]')) {
    const frame = image.closest('[data-image-frame]');
    if (!frame) {
      continue;
    }
    const markFailed = () => frame.setAttribute('data-image-failed', '');
    if (image.complete && image.naturalWidth === 0 && image.getAttribute('src')) {
      markFailed();
    } else {
      image.addEventListener('error', markFailed, { once: true });
    }
    watched += 1;
  }
  return watched;
}
