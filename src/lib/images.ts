/**
 * Purpose: Finds optional source images by filename at build time.
 * Scope: Photographs, project icons, and interface captures in local asset folders; never import in browser code.
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
