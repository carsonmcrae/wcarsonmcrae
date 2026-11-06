/**
 * Purpose: Protect permanent reaction identities for every approved image presentation.
 * Scope: Canonical photograph/screen namespaces, deduplication, four kinds, and post compatibility.
 * Does NOT belong: Browser rendering, asset transforms, or database mutations.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { timelinePosts } from '../../src/data/timeline';
import { postAliases } from '../../src/data/post-aliases';
import { supportedReactionIds, supportedReactionKeys } from '../../src/data/reaction-targets';
import { carsonGallery, dogGalleries, lifePhotos } from '../../src/data/photo-gallery';
import { aboutPortrait, profile } from '../../src/data/profile';
import { photoReactionId } from '../../src/lib/photo-reaction-id';
import { reactionKeys } from '../../src/lib/reaction-keys';

describe('approved reaction targets', () => {
  it('keeps a photo identity independent of its album, route, size, and related post', () => {
    expect(photoReactionId('margot-1')).toBe('photo-margot-1');
    expect(photoReactionId('margot-1', 'photo')).toBe('photo-margot-1');
    expect(photoReactionId('daysforth-interface', 'screen')).toBe('screen-daysforth-interface');
    expect(photoReactionId('same', 'screen')).not.toBe(photoReactionId('same'));
  });

  it('preserves every published post and retired alias key independently from image votes', () => {
    const legacy = reactionKeys([
      ...timelinePosts.map((post) => post.id),
      ...Object.keys(postAliases),
    ]);
    for (const post of timelinePosts) expect(post.id).not.toMatch(/^(?:photo|screen)-/);
    expect(supportedReactionKeys).toEqual(expect.arrayContaining(legacy));
    expect(supportedReactionKeys).toEqual(
      expect.arrayContaining(['born', 'born--celebrate', 'ttsnative-started', 'photo-1999-born']),
    );
    expect(supportedReactionIds).not.toContain('photo-unapproved-upload');
    expect(supportedReactionIds).not.toContain('photo-carson-headshot');
    expect(new Set(supportedReactionIds).size).toBe(supportedReactionIds.length);
    expect(new Set(supportedReactionKeys).size).toBe(supportedReactionIds.length * 4);
    expect(supportedReactionKeys.every((key) => /^[a-z0-9-]+$/.test(key))).toBe(true);
  });

  it('includes covers, extra photographs, dog and personal galleries, and standalone portraits', () => {
    const photographs = [
      ...timelinePosts.flatMap((post) => post.gallery ?? []),
      ...dogGalleries.flatMap((album) => album.photos),
      ...carsonGallery.photos,
      ...lifePhotos,
    ];
    for (const photo of photographs)
      expect(supportedReactionIds, photo.name).toContain(
        photoReactionId(photo.name, photo.imageKind),
      );
    for (const post of timelinePosts)
      expect(supportedReactionIds, post.id).toContain(photoReactionId(post.image!, post.imageKind));
    expect(supportedReactionIds).toEqual(
      expect.arrayContaining([
        photoReactionId(profile.portrait),
        photoReactionId(aboutPortrait),
        'photo-me-my-family',
        'photo-me-nicoles-family',
        'screen-recalen-interface',
        'screen-recalen-cover',
      ]),
    );
    expect(aboutPortrait).toBe('carson-solo');
    expect(supportedReactionIds.filter((id) => id === 'photo-margot-1')).toHaveLength(1);
    expect(reactionKeys(['photo-margot-1'])).toEqual([
      'photo-margot-1',
      'photo-margot-1--celebrate',
      'photo-margot-1--laugh',
      'photo-margot-1--support',
    ]);
  });
});
