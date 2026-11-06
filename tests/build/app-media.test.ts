/**
 * Purpose: Verify the published app explanations and the mixed-screen Recalen gallery.
 * Scope: Complete visible captions, distinct cover/original URLs, and stable image reaction identities.
 * Does NOT belong: Source artwork provenance or browser dialog lifecycle.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { timelinePosts } from '../../src/data/timeline';
import { parse } from './dist';

describe('app moments', () => {
  const home = parse('index.html');
  it('ships every complete app caption in the timeline and its permanent post', () => {
    for (const post of timelinePosts.filter((moment) => moment.project)) {
      const detail = parse(`posts/${post.id}/index.html`);
      expect(home.querySelector(`#moment-${post.id} .post-card__caption`)!.textContent).toBe(
        post.caption,
      );
      expect(detail.querySelector('.post-detail__caption')!.textContent).toBe(post.caption);
    }
  });

  it('keeps the original Recalen screen identity when it moves into the post album', () => {
    const post = parse('posts/recalen-beta/index.html');
    const cover = post.querySelector('.post-detail__photo [data-photo="screen-recalen-cover"]');
    const original = post.querySelector('.post-album [data-photo="screen-recalen-interface"]');
    expect(cover).not.toBeNull();
    expect(original).not.toBeNull();
    expect(cover!.getAttribute('href')).not.toBe(original!.getAttribute('href'));
    expect(cover!.getAttribute('data-photo-album')).toBe('post-recalen-beta');
    expect(original!.getAttribute('data-photo-album')).toBe('post-recalen-beta');
    expect(post.querySelector('[data-photo="photo-recalen-interface"]')).toBeNull();
    expect(home.querySelector('#moment-recalen-beta .post-media__count')?.textContent?.trim()).toBe(
      '2',
    );
  });
});
