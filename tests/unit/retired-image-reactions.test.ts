/**
 * Purpose: Preserve published photo reaction identities independently of current presentation.
 * Scope: Retirement simulation, all four wire keys, and previously accumulated permanent totals.
 * Does NOT belong: New content approval, asset loading, or production database writes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import publishedImages from '../../src/data/published-image-reactions.json';
import { handleReactions } from '../../src/lib/reaction-service';
import { reactionKeys } from '../../src/lib/reaction-keys';
import { reactionDatabase } from './reaction-db';

afterEach(() => {
  vi.doUnmock('../../src/data/timeline');
  vi.doUnmock('../../src/data/photo-gallery');
  vi.doUnmock('../../src/data/life');
  vi.doUnmock('../../src/data/profile');
  vi.resetModules();
});

it('retains published image counts and keys when all presentation references are removed', async () => {
  vi.resetModules();
  vi.doMock('../../src/data/timeline', () => ({ timelinePosts: [] }));
  vi.doMock('../../src/data/photo-gallery', () => ({
    carsonGallery: { photos: [] },
    dogGalleries: [],
    lifePhotos: [],
  }));
  vi.doMock('../../src/data/life', () => ({ dogs: [] }));
  vi.doMock('../../src/data/profile', () => ({
    profile: { portrait: 'future-portrait' },
    aboutPortrait: 'future-about',
  }));
  const { supportedReactionKeys } = await import('../../src/data/reaction-targets');
  expect(supportedReactionKeys).toEqual(expect.arrayContaining(reactionKeys(publishedImages)));
  expect(publishedImages).toContain('screen-recalen-interface');
  expect(publishedImages).toContain('photo-me-my-family');
  expect(new Set(publishedImages).size).toBe(publishedImages.length);
  const { db, sqlite } = reactionDatabase();
  try {
    sqlite.exec("INSERT INTO reaction_totals VALUES ('screen-recalen-interface', 7)");
    const response = await handleReactions(
      new Request('https://api.test/reactions'),
      { DB: db },
      supportedReactionKeys,
    );
    expect(await response.json()).toMatchObject({ 'screen-recalen-interface': 7 });
  } finally {
    sqlite.close();
  }
});
