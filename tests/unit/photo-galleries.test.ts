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
import { carsonGallery, dogGalleries, lifePhotos } from '../../src/data/photo-gallery';

const importedNames = [
  ...carsonGallery.photos,
  ...dogGalleries.flatMap((gallery) => gallery.photos.slice(1)),
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
        `${dog.swatch}-2`,
        ...Array.from({ length: 6 }, (_, number) => `${dog.swatch}-gallery-${number + 1}`),
      ]);
      expect(gallery.photos.map((photo) => photo.name)).not.toContain(dog.photo);
    }
  });

  it('uses eight distinct Carson photographs and the new horizontal watch photograph', async () => {
    expect(carsonGallery.photos.map((photo) => photo.name)).toEqual(
      Array.from({ length: 8 }, (_, index) => `carson-gallery-${index + 1}`),
    );
    expect(new Set(importedNames).size).toBe(21);
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
