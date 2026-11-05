/**
 * Purpose: Reserve each timeline cover's exact proportions before its image response arrives.
 * Scope: Build-time photo/screenshot metadata lookup and CSP-compatible frame ratio selectors.
 * Does NOT belong: Image optimization, timeline scrolling, or browser layout measurements.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { TimelinePost } from '../data/timeline';
import { getPhoto, getProjectImage } from './images';
import { postMedia } from './post-media';

export function mediaFrameStyles(posts: readonly TimelinePost[]): string {
  return posts
    .flatMap((post) => {
      const media = postMedia(post);
      if (media.kind === 'project') return [];
      const source = media.kind === 'photo' ? getPhoto(media.name) : getProjectImage(media.name);
      if (!source) throw new Error(`Missing timeline cover: ${media.name}`);
      return [
        `.post-media__frame:has([data-moment-image=${JSON.stringify(media.name)}]) { --media-ratio: ${source.width} / ${source.height}; }`,
      ];
    })
    .join('\n');
}
