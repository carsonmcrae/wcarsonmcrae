/**
 * Purpose: Describe shipped Daysforth changes in language useful to visitors.
 * Scope: Permanent release history and the current version from the canonical package manifest.
 * Does NOT belong: Personal timeline events or instructions for publishing a release.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import manifest from '../../package.json' with { type: 'json' };

export const currentVersion = manifest.version;

export const releases = [
  {
    version: '1.0.0',
    title: 'A place for the moments along the way',
    summary:
      'The first version of Daysforth brings a personal timeline, photographs, and projects together in one place.',
    sections: [
      {
        id: 'explore',
        title: 'Explore at your own pace',
        items: [
          'Switch between Timeline and Posts, browse by category, and jump to a month or year with the date controls.',
          'Open any moment on its own permanent page, then move to earlier or newer moments.',
          'Follow the story through About, Work, and Life, with links to the projects behind it.',
        ],
      },
      {
        id: 'photos',
        title: 'A closer look at the photos',
        items: [
          'Open photographs in an on-page viewer and move through albums with their captions.',
          'Use the keyboard or touch controls to browse, and close the viewer to return to your place.',
        ],
      },
      {
        id: 'keep',
        title: 'Keep the moments that matter',
        items: [
          'Save posts in this browser and find them again using the Saved category.',
          'Copy a link to share a moment, or add a permanent reaction to its shared count.',
          'Choose whether this browser remembers your theme, saved posts, and reaction choices. Storage settings let you change your mind or clear saved data.',
        ],
      },
      {
        id: 'read',
        title: 'Make yourself comfortable',
        items: [
          'Choose a light or dark theme, with layouts that adapt to smaller screens and enlarged text.',
          'Browse the story and permanent pages even when JavaScript is unavailable.',
          'Read the privacy notice and accessibility statement for how the site works and the evaluation still to be completed.',
        ],
      },
    ],
  },
];
