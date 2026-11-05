/**
 * Purpose: Daysforth’s public brand foundations.
 * Scope: Name, positioning, voice, palette, typography, and asset inventory.
 * Does NOT belong: Carson’s biography or page-specific content.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export const brand = {
  name: 'Daysforth',
  domain: 'daysforth.com',
  tagline: 'Your life, as it unfolds.',
  description:
    'A profile that is a timeline. The everyday moments and big milestones, together in the order they happened.',
  promise: 'Give the whole story a place.',
  font: 'Inter',
  colors: [
    {
      name: 'Forth blue',
      hex: '#1746ff',
      role: 'Primary mark, links, selected controls, and timeline points',
    },
    { name: 'Ink', hex: '#111318', role: 'Headings, wordmark, and body copy' },
    {
      name: 'Paper',
      hex: '#ffffff',
      role: 'The primary canvas; leave room for people and their photographs',
    },
    { name: 'Mist', hex: '#f5f7fb', role: 'Quiet secondary surfaces' },
    { name: 'Slate', hex: '#545e72', role: 'Supporting text with readable contrast' },
  ],
  voice: [
    {
      title: 'Human',
      detail: 'Write like someone who knows you. Use familiar words and contractions.',
    },
    {
      title: 'Considered',
      detail: 'Give moments room. Let photographs and clear words carry the feeling.',
    },
    { title: 'Forward-looking', detail: 'Make space for what came before and what comes next.' },
  ],
  downloads: [
    { file: 'daysforth-lockup.svg', label: 'Primary horizontal logo' },
    { file: 'daysforth-lockup-reversed.svg', label: 'Reversed horizontal logo' },
    { file: 'daysforth-lockup-mono.svg', label: 'Monochrome horizontal logo' },
    { file: 'daysforth-stacked.svg', label: 'Stacked logo' },
    { file: 'daysforth-wordmark.svg', label: 'Outlined wordmark' },
    { file: 'daysforth-mark.svg', label: 'App mark' },
    { file: 'daysforth-mark-small.svg', label: 'Small-size app mark · 16–24 px' },
    { file: 'daysforth-mark-small-mono.svg', label: 'Small-size monochrome mark' },
    { file: 'daysforth-mark-small-white.svg', label: 'Small-size white mark' },
    { file: 'daysforth-mark-mono.svg', label: 'Monochrome mark' },
    { file: 'daysforth-mark-white.svg', label: 'White mark' },
    { file: 'daysforth-social.svg', label: 'Social card · 1200 × 630' },
    { file: 'daysforth-banner.svg', label: 'Profile banner · 1500 × 500' },
  ],
};
