/**
 * Purpose: Unit tests for src/lib/images.ts.
 * Scope: Finding images by name, the bundled project images, missing photos, and runtime fallbacks
 *   for images that fail to load.
 * Does NOT belong: Image optimization, which Astro handles at build time.
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  availablePhotos,
  availableProjectImages,
  fileStem,
  findImage,
  getPhoto,
  getProjectImage,
  type ImageModules,
} from '../../src/lib/images';
import { initImageFallbacks } from '../../src/lib/image-fallbacks';

const modules = {
  '../assets/photos/carson-portrait.jpg': { default: { src: '/carson.jpg' } },
  '../assets/photos/margot.webp': { default: { src: '/margot.webp' } },
} as unknown as ImageModules;

describe('fileStem', () => {
  it('strips folders and extensions', () => {
    expect(fileStem('../assets/photos/carson-portrait.jpg')).toBe('carson-portrait');
    expect(fileStem('quinn')).toBe('quinn');
    expect(fileStem('')).toBe('');
  });
});

describe('findImage', () => {
  it('finds images by filename without extension', () => {
    expect(findImage(modules, 'margot')).toEqual({ src: '/margot.webp' });
  });

  it('returns undefined for missing or empty names', () => {
    expect(findImage(modules, 'quinn')).toBeUndefined();
    expect(findImage(modules, '')).toBeUndefined();
    expect(findImage(modules, null)).toBeUndefined();
    expect(findImage(modules, undefined)).toBeUndefined();
  });
});

describe('bundled image lookups', () => {
  it('finds every project icon', () => {
    for (const name of ['ttsnative', 'recalen', 'picpledge']) {
      expect(getProjectImage(name), name).toBeDefined();
      expect(availableProjectImages()).toContain(name);
    }
  });

  it('falls back cleanly when a photo has not been added yet', () => {
    expect(getPhoto('definitely-not-a-photo')).toBeUndefined();
    expect(Array.isArray(availablePhotos())).toBe(true);
  });
});

describe('initImageFallbacks', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marks the frame when an image fails to load', () => {
    document.body.innerHTML = `
      <figure data-image-frame id="frame"><img data-fallback alt="x" src="/missing.jpg" /></figure>`;
    const image = document.querySelector('img')!;
    Object.defineProperty(image, 'complete', { value: false });
    expect(initImageFallbacks(document)).toBe(1);
    image.dispatchEvent(new Event('error'));
    expect(document.getElementById('frame')!.hasAttribute('data-image-failed')).toBe(true);
  });

  it('marks frames whose image already failed before scripts ran', () => {
    document.body.innerHTML = `
      <figure data-image-frame id="frame"><img data-fallback alt="x" src="/missing.jpg" /></figure>`;
    const image = document.querySelector('img')!;
    Object.defineProperty(image, 'complete', { value: true });
    Object.defineProperty(image, 'naturalWidth', { value: 0 });
    initImageFallbacks(document);
    expect(document.getElementById('frame')!.hasAttribute('data-image-failed')).toBe(true);
  });

  it('leaves loaded images alone and skips images without a frame', () => {
    document.body.innerHTML = `
      <figure data-image-frame id="frame"><img data-fallback alt="x" src="/ok.jpg" /></figure>
      <img data-fallback alt="y" src="/loose.jpg" />`;
    const image = document.querySelector('#frame img')!;
    Object.defineProperty(image, 'complete', { value: true });
    Object.defineProperty(image, 'naturalWidth', { value: 640 });
    expect(initImageFallbacks(document)).toBe(1);
    expect(document.getElementById('frame')!.hasAttribute('data-image-failed')).toBe(false);
  });
});
