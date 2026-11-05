/**
 * Purpose: Check the rendered personal galleries and household text equivalent.
 * Scope: Distinct albums, shared enlargement links, preserved hero photographs, and visible roles.
 * Does NOT belong: Image processing or interactive dialog keyboard checks.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { dogs, orgChart } from '../../src/data/life';
import { carsonGallery, dogGalleries } from '../../src/data/photo-gallery';
import { parse } from './dist';

describe('personal photo galleries', () => {
  const life = parse('life/index.html');
  const about = parse('about/index.html');

  it('gives each dog a compact album with both original photographs and all six additions', () => {
    for (const gallery of dogGalleries) {
      const album = life.getElementById(gallery.id)!;
      expect(album.closest('.dog')).not.toBeNull();
      expect(album.querySelector('.album-preview__action')?.textContent).toContain('photos');
      expect(album.querySelector('.album-preview__action')?.getAttribute('data-photo-alt')).toBe(
        gallery.photos[0]!.alt,
      );
      expect(album.querySelectorAll('.photo-gallery [data-photo-alt]')).toHaveLength(0);
      expect(album.querySelectorAll('.photo-gallery [data-photo]')).toHaveLength(8);
      expect(
        Array.from(album.querySelectorAll('img'), (image) =>
          image.getAttribute('data-moment-image'),
        ),
      ).toEqual(gallery.photos.map((photo) => photo.name));
    }
    expect(life.querySelector('.dog-album')).toBeNull();
    for (const dog of dogs) {
      expect(
        life
          .querySelector(`#dog-${dog.swatch} + .photo [data-moment-image]`)
          ?.getAttribute('data-moment-image'),
      ).toBe(dog.photo);
    }
  });

  it('preserves the About portrait and enlarges every Carson gallery photo', () => {
    expect(about.querySelector('.secondary-hero [data-moment-image="carson-solo"]')).not.toBeNull();
    expect(about.querySelectorAll('#photos .photo-gallery [data-photo]')).toHaveLength(
      carsonGallery.photos.length,
    );
    expect(about.querySelector('#facts')!.nextElementSibling?.id).toBe('photos');
    expect(about.querySelector('#photos .photo-gallery figcaption')).toBeNull();
    for (const photo of carsonGallery.photos) {
      const image = about.querySelector(`#photos [data-moment-image="${photo.name}"]`)!;
      expect(image.closest('a')?.hasAttribute('data-photo')).toBe(true);
      expect(image.closest('a')?.hasAttribute('data-photo-alt')).toBe(false);
      expect(image.getAttribute('alt')).toBe(photo.alt);
    }
    expect(
      life.querySelector('#photos [data-moment-image="first-watch-new-photo"]'),
    ).not.toBeNull();
  });

  it('presents every household role and duty as visible text alongside decorative connectors', () => {
    const chart = life.querySelector('.org')!;
    expect(chart.closest('details')).toBeNull();
    expect(chart.getAttribute('aria-labelledby')).toBe('household-chart-title');
    for (const name of [...orgChart.management, ...orgChart.staff]) {
      const heading = Array.from(chart.querySelectorAll('h4')).find(
        (node) => node.textContent === name,
      )!;
      expect(heading.closest('[aria-hidden="true"], .visually-hidden')).toBeNull();
    }
    expect(chart.textContent).toContain(orgChart.staffDuties);
    expect(chart.textContent).toContain('Management');
    expect(chart.textContent).toContain('Staff');
    expect(chart.querySelector('.org__connectors')?.getAttribute('aria-hidden')).toBe('true');
  });
});
