/**
 * Purpose: Keep category presentation complete and compatible with real post/filter contracts.
 * Scope: Every post category has a distinct icon/tone, and every choice references a real glyph.
 * Does NOT belong: CSS contrast or browser selection behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { categoryPresentation } from '../../src/data/categories';
import { timelinePosts } from '../../src/data/timeline';
import { icons } from '../../src/lib/icons';

describe('category presentation', () => {
  it('gives every published post category a readable label and distinct visual identity', () => {
    const categories = [...new Set(timelinePosts.map((post) => post.category))];
    expect(categories).toHaveLength(3);
    expect(new Set(categories.map((category) => categoryPresentation[category].icon)).size).toBe(3);
    expect(new Set(categories.map((category) => categoryPresentation[category].tone)).size).toBe(3);
    for (const category of categories) expect(categoryPresentation[category].label).toBe(category);
  });
  it('covers every supported filter with a real decorative glyph', () => {
    expect(Object.keys(categoryPresentation)).toEqual([
      'All',
      'Work',
      'Projects',
      'Life',
      'Milestones',
      'Saved',
    ]);
    for (const presentation of Object.values(categoryPresentation)) {
      expect(icons[presentation.icon]).toContain('<svg');
      expect(presentation.label.length).toBeGreaterThan(0);
    }
    expect(categoryPresentation.All.label).toBe('All categories');
    expect(icons.location).toContain('<svg');
  });
});
