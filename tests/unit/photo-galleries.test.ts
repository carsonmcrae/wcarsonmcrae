/**
 * Purpose: Protect the approved photo imports and distinct personal albums.
 * Scope: Existing dog portraits, new gallery membership, horizontal watch media, and metadata safety.
 * Does NOT belong: Browser dialog behavior or photographic approval decisions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { dogs, orgChart } from '../../src/data/life';
import {
  carsonGallery,
  dogGalleries,
  familyPhotos,
  lifePhotos,
  weddingPhotos,
} from '../../src/data/photo-gallery';

const importedNames = [
  ...carsonGallery.photos,
  ...familyPhotos,
  ...dogGalleries.flatMap((gallery) => gallery.photos.slice(2)),
  lifePhotos.find((photo) => photo.postId === 'watch-collecting')!,
].map((photo) => photo.name);

describe('approved personal albums', () => {
  it('preserves the dog portraits and their confirmed breeds', () => {
    expect(dogs.map(({ name, photo, breed }) => ({ name, photo, breed }))).toEqual([
      { name: 'Margot', photo: 'margot-1', breed: 'Goldendoodle' },
      { name: 'Quinn', photo: 'quinn-1', breed: 'Aussiedoodle' },
    ]);
    for (const [index, gallery] of dogGalleries.entries()) {
      const dog = dogs[index]!;
      expect(gallery.id).toBe(`${dog.swatch}-gallery`);
      expect(gallery.photos.map((photo) => photo.name)).toEqual([
        `${dog.swatch}-1`,
        `${dog.swatch}-2`,
        ...Array.from({ length: 6 }, (_, number) => `${dog.swatch}-gallery-${number + 1}`),
      ]);
      expect(gallery.photos.filter((photo) => photo.name === dog.photo)).toHaveLength(1);
    }
  });

  it('uses eight distinct Carson photographs and the new horizontal watch photograph', async () => {
    expect(carsonGallery.photos.map((photo) => photo.name)).toEqual(
      Array.from({ length: 8 }, (_, index) => `carson-gallery-${index + 1}`),
    );
    expect(new Set(importedNames).size).toBe(23);
    const watch = await sharp(
      join(import.meta.dirname, '../../src/assets/photos/first-watch-new-photo.jpg'),
    ).metadata();
    expect(watch.width).toBeGreaterThan(watch.height);
    for (const photo of [
      ...carsonGallery.photos,
      ...dogGalleries.flatMap((album) => album.photos),
    ]) {
      expect(photo.alt.length, photo.name).toBeGreaterThan(15);
      expect(photo.caption.length, photo.name).toBeGreaterThan(0);
    }
  });

  it('keeps corrected subjects and supplied context attached to the right canonical photographs', () => {
    const margot = dogGalleries[0]!.photos;
    const quinn = dogGalleries[1]!.photos;
    expect(margot[0]!.alt).toContain('yellow duck');
    expect(margot[1]!.alt).toContain('glasses');
    expect(margot[1]!.alt).not.toContain('bow tie');
    expect(quinn[0]!.alt).toContain('glasses');
    expect(quinn[1]!.caption).toContain('haircut');
    expect(carsonGallery.photos[5]!.caption).toContain('Nashville SC');
    expect(carsonGallery.photos[5]!.caption).toContain('Messi');
    expect(carsonGallery.photos[6]!.alt).toContain('Jackson playing video games');
    expect(carsonGallery.photos[0]!.postId).toBe('married-nicole');
    expect(carsonGallery.photos[0]!.caption).toBe(
      'The end of our wedding was a hit… I was clearly having a great time, at least.',
    );
  });

  it('adds two distinct approved family frames to Life and the existing wedding album', () => {
    expect(familyPhotos.map((photo) => photo.name)).toEqual(['me-my-family', 'me-nicoles-family']);
    expect(familyPhotos.every((photo) => photo.postId === 'married-nicole')).toBe(true);
    expect(weddingPhotos.slice(-2)).toEqual(familyPhotos);
    expect(new Set(weddingPhotos.map((photo) => photo.name)).size).toBe(weddingPhotos.length);
    expect(weddingPhotos.every((photo) => !photo.name.includes('b-w'))).toBe(true);
  });

  it('keeps the household chart tied to the approved management, staff, and duties', () => {
    expect(orgChart.management).toEqual(dogs.map((dog) => dog.name));
    expect(orgChart.staff).toEqual(['Nicole', 'Carson']);
    expect(orgChart.staffDuties).toBe('walks, meals, and door operations');
  });

  it.each(importedNames)('ships a normalized metadata-free %s', async (name) => {
    const source = await readFile(
      join(import.meta.dirname, '../../src/assets/photos', `${name}.jpg`),
    );
    const metadata = await sharp(source).metadata();
    expect(Math.max(metadata.width, metadata.height)).toBeLessThanOrEqual(2000);
    expect(source.byteLength).toBeLessThanOrEqual(1.5 * 1024 * 1024);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.iptc).toBeUndefined();
  });
});
