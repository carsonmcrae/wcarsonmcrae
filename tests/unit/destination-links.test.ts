/**
 * Purpose: Protect video destination identity and existing privacy-aware link behavior.
 * Scope: Trusted YouTube hosts, spoof/other destinations, project subpaths, and invalid URLs.
 * Does NOT belong: Remote playback or assertions about provider content.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { destinationLink } from '../../src/lib/destination-links';

describe('standalone destination presentation', () => {
  it.each([
    'https://youtube.com/watch?v=approved',
    'https://www.youtube.com/watch?v=approved',
    'https://m.youtube.com/watch?v=approved',
    'https://youtu.be/approved',
  ])('identifies the real YouTube destination %s without changing it', (href) => {
    expect(destinationLink(href)).toEqual({
      href,
      icon: 'youtube',
      external: true,
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
  it.each([
    'https://youtube.com.example.org/video',
    'https://notyoutube.com/video',
    'http://youtube.com/video',
    'https://example.org/watch?next=youtube.com',
    'mailto:hello@example.com',
  ])('does not mislabel another destination %s', (href) => {
    expect(destinationLink(href).icon).toBe('link');
  });
  it('keeps local links in this tab and preserves deployment bases and anchors', () => {
    expect(destinationLink('/contact/', '/wcarsonmcrae/')).toEqual({
      href: '/wcarsonmcrae/contact/',
      icon: 'link',
      external: false,
      target: undefined,
      rel: undefined,
    });
    expect(destinationLink('#section', '/wcarsonmcrae/').href).toBe('#section');
    expect(destinationLink('/contact/').href).toBe('/contact/');
  });
  it('fails on a malformed absolute destination instead of inventing a playable video', () => {
    expect(() => destinationLink('https://[')).toThrow();
  });
});
