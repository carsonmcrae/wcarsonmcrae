/**
 * Purpose: Describe shipped Daysforth changes in language useful to visitors.
 * Scope: Permanent dated release history and the current version from the canonical package manifest.
 * Does NOT belong: Personal timeline events or instructions for publishing a release.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import manifest from '../../package.json' with { type: 'json' };

export const currentVersion = manifest.version;

function releaseSection(id: string, title: string, items: readonly string[]) {
  return { id, title, items: [...items] };
}

export const releases = [
  {
    version: '1.1.0',
    date: '2026-11-05',
    title: 'A closer look, and a reaction for every photograph',
    summary:
      'Enjoy a steadier photo viewer with a thumbnail strip, react to individual photographs, and find more of the people and stories behind the albums.',
    sections: [
      releaseSection('viewer', 'Stay with the photograph', [
        'Browse a fixed photo viewer with a thumbnail strip that keeps the rest of the album within reach.',
        'Move between photographs with buttons, arrow keys, or a swipe, then return to your place when you close the viewer.',
        'Add a reaction to an individual photograph, with its own shared count.',
      ]),
      releaseSection('navigation', 'Find your way comfortably', [
        'Use clearer mobile header and menu controls, with more comfortable navigation on smaller screens.',
        'Read a permanent calendar date on every release, on both the updates list and its own notes page.',
      ]),
      releaseSection('people', 'Meet more of the family', [
        'Read the stories behind all 24 photographs in Margot’s, Quinn’s, and Carson’s albums.',
        'Find both sides of the family at the bottom of Life and in the wedding album.',
        'Catch up on watch collecting, golf, pickleball, and travel in Life’s Out and about section.',
      ]),
    ],
  },
  {
    version: '1.0.1',
    date: '2026-11-05',
    title: 'More room for the photos, less clutter along the way',
    summary:
      'Browse personal albums in a carousel, recognize moment categories at a glance, and use quieter timeline controls that appear when you need them.',
    sections: [
      releaseSection('albums', 'Step into an album', [
        'Open Margot’s and Quinn’s photo albums directly from their cards on Life.',
        'Find Carson’s photo preview below Quick facts on About.',
        'Move through album photographs with previous and next buttons, arrow keys, or a swipe. Close the viewer to return to your place.',
      ]),
      releaseSection('timeline', 'A calmer timeline', [
        'Timeline shortcuts appear after you scroll into the story, with only the useful direction shown at either end.',
        'Use the compact desktop moment navigator beside the scrollbar to preview events and jump directly to one.',
        'Photo counts and post controls sit at the photo corners and appear when you hover, focus, or tap a moment.',
        'Work, Projects, and Life have matching category icons and colored chips on moments and in the category menu.',
      ]),
      releaseSection('profile', 'A little more social', [
        'The profile’s handle, Nashville, TN location, and destination links now use compact chips on desktop and mobile.',
        'Video destinations carry a YouTube play icon and open only when you choose their links.',
        'The compact footer keeps privacy, browser settings, accessibility, and releases visible, with other destinations in More. The first-visit storage banner still disappears after either choice.',
      ]),
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-03',
    title: 'A place for the moments along the way',
    summary:
      'The first version of Daysforth brings a personal timeline, photographs, and projects together in one place.',
    sections: [
      releaseSection('explore', 'Explore at your own pace', [
        'Switch between Timeline and Posts, browse by category, and jump to a month or year with the date controls.',
        'Open any moment on its own permanent page, then move to earlier or newer moments.',
        'Follow the story through About, Work, and Life, with links to the projects behind it.',
      ]),
      releaseSection('photos', 'A closer look at the photos', [
        'Open photographs in an on-page viewer and move through albums with their captions.',
        'Use the keyboard or touch controls to browse, and close the viewer to return to your place.',
      ]),
      releaseSection('keep', 'Keep the moments that matter', [
        'Save posts in this browser and find them again using the Saved category.',
        'Copy a link to share a moment, or add a permanent reaction to its shared count.',
        'Choose whether this browser remembers your theme, saved posts, and reaction choices. Storage settings let you change your mind or clear saved data.',
      ]),
      releaseSection('read', 'Make yourself comfortable', [
        'Choose a light or dark theme, with layouts that adapt to smaller screens and enlarged text.',
        'Browse the story and permanent pages even when JavaScript is unavailable.',
        'Read the privacy notice and accessibility statement for how the site works and the evaluation still to be completed.',
      ]),
    ],
  },
];
