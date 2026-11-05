/**
 * Purpose: Keep photo destinations descriptively named independently of descendant rendering.
 * Scope: Every built image-trigger name and visible-label album entry, without duplicated generic prefixes.
 * Does NOT belong: Browser lifecycle behavior or changing image alternatives to satisfy a scan.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { htmlPages, parse } from './dist';

describe.each(htmlPages)('photo link names in %s', (path) => {
  it('names image triggers directly and preserves visible-label album entries', () => {
    const document = parse(path);
    for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-photo]')) {
      const image = link.querySelector('img');
      if (image) {
        expect(image.alt.trim().length, path).toBeGreaterThan(0);
        expect(link.getAttribute('aria-label'), path).toBe(image.alt);
      } else {
        expect(link.getAttribute('aria-label'), path).toBeNull();
        expect(link.textContent!.trim().length, path).toBeGreaterThan(0);
      }
    }
  });
});
