/**
 * Purpose: Protect the approved new moments, saved-event migration, and browsing filters.
 * Scope: Confirmed dates, real media, distinct albums, one event per app, and browser-local bookmark continuity.
 * Does NOT belong: Visual layout or production network calls.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it, vi } from 'vitest';
import { timelinePosts } from '../../src/data/timeline';
import { postAliases } from '../../src/data/post-aliases';
import { reactions } from '../../src/data/reactions';
import { getPhoto, getProjectImage } from '../../src/lib/images';
import { visibleMoments } from '../../src/lib/timeline-model';
import { migrateSavedMoments } from '../../src/lib/saved-moments';
import { reactionKey, reactionKeys } from '../../src/lib/reaction-keys';
import { memoryStorage } from './helpers';
describe('confirmed additions', () => {
  it('publishes the requested dates and only one event per app', () => {
    const dates = Object.fromEntries(timelinePosts.map((post) => [post.id, post.date]));
    expect(dates).toMatchObject({
      'watch-collecting': '2012-09',
      'eagle-scout': '2016-10',
      'fbla-video-awards': '2017-07',
      'high-school-graduation': '2018-05',
      'started-apple': '2018-07',
      'sydney-study-abroad': '2019-08',
      'youtube-experiment': '2019-10',
      'made-a-watch': '2024-12',
      'started-pickleball': '2026-05',
      'started-golf': '2026-08',
    });
    expect(timelinePosts.find((post) => post.id === 'infoworks')!.endDate).toBe('2022-09');
    expect(timelinePosts.find((post) => post.id === 'started-apple')!.endDate).toBe('2022-05');
    for (const project of ['ttsnative', 'recalen', 'picpledge', 'daysforth'])
      expect(timelinePosts.filter((post) => post.project === project)).toHaveLength(1);
    for (const [from, to] of Object.entries(postAliases)) {
      expect(dates).not.toHaveProperty(from);
      expect(dates).toHaveProperty(to);
    }
  });
  it('gives every event real cover media and keeps album images distinct', () => {
    for (const post of timelinePosts) {
      expect(post.image, post.id).toBeTruthy();
      expect(post.imageAlt!.length, post.id).toBeGreaterThan(8);
      expect(
        post.imageKind === 'screen' ? getProjectImage(post.image) : getPhoto(post.image),
        post.id,
      ).toBeDefined();
      const names = [post.image, ...(post.gallery ?? []).map((photo) => photo.name)];
      expect(new Set(names).size, post.id).toBe(names.length);
      for (const photo of post.gallery ?? [])
        expect(getPhoto(photo.name), photo.name).toBeDefined();
    }
    expect(
      timelinePosts
        .find((post) => post.id === 'married-nicole')!
        .gallery!.map((photo) => photo.name),
    ).toEqual(['nicole-carson-1', 'carson-friends']);
  });
});
describe('focused filters', () => {
  it('shows milestones alone and excludes unsaved milestones from Saved', () => {
    const posts = [
      {
        id: 'milestone',
        date: '2020-01',
        category: 'Life' as const,
        milestone: true,
        saved: false,
      },
      { id: 'saved', date: '2021-01', category: 'Work' as const, saved: true },
      { id: 'ordinary', date: '2022-01', category: 'Life' as const },
    ];
    expect(visibleMoments(posts, 'Milestones').map((post) => post.id)).toEqual(['milestone']);
    expect(visibleMoments(posts, 'Saved').map((post) => post.id)).toEqual(['saved']);
    expect(visibleMoments(timelinePosts, 'Milestones')).toHaveLength(6);
  });
});
describe('saved event migration', () => {
  it('migrates old bookmarks once and respects later removal', () => {
    const storage = memoryStorage({ 'daysforth.saved.ttsnative-started': 'true' });
    migrateSavedMoments(storage);
    expect(storage.getItem('daysforth.saved.ttsnative-1')).toBe('true');
    storage.setItem('daysforth.saved.ttsnative-1', 'false');
    migrateSavedMoments(storage);
    expect(storage.getItem('daysforth.saved.ttsnative-1')).toBe('false');
    expect(() => migrateSavedMoments(null)).not.toThrow();
  });
  it('does not mark a failed migration complete, allowing a later retry', () => {
    const setItem = vi.fn(() => {
      throw new Error('full');
    });
    migrateSavedMoments({
      getItem: (key) => (key === 'daysforth.saved.ttsnative-started' ? 'true' : null),
      setItem,
    });
    expect(setItem).toHaveBeenCalledExactlyOnceWith('daysforth.saved.ttsnative-1', 'true');
  });
});
describe('reaction identity compatibility', () => {
  it('keeps existing heart keys and assigns distinct stable keys to new options', () => {
    expect(reactionKey('born', 'heart')).toBe('born');
    expect(reactionKeys(['born'])).toEqual([
      'born',
      'born--celebrate',
      'born--laugh',
      'born--support',
    ]);
    expect(new Set(reactions.map((reaction) => reaction.id)).size).toBe(4);
  });
});
