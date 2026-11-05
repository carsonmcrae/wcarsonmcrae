/**
 * Purpose: Resolve complete approved albums and descriptive viewer content from native links.
 * Scope: Album membership, duplicate entry links, captions, and related-moment fallbacks.
 * Does NOT belong: Dialog state, image processing, or persistence.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function albumPhotos(doc: Document, trigger: HTMLAnchorElement): HTMLAnchorElement[] {
  const id = trigger.dataset['photoAlbum'];
  if (!id) return [trigger];
  const distinct = new Map<string, HTMLAnchorElement>();
  for (const photo of doc.querySelectorAll<HTMLAnchorElement>('a[data-photo]')) {
    if (photo.dataset['photoAlbum'] === id && !distinct.has(photo.href))
      distinct.set(photo.href, photo);
  }
  return [...distinct.values()];
}
export function photoDetails(photo: HTMLAnchorElement) {
  const alt = photo.dataset['photoAlt'] ?? photo.querySelector('img')!.alt;
  return {
    src: photo.href,
    alt,
    caption: photo.dataset['photoCaption'] ?? alt,
    moment:
      photo.dataset['photoPost'] ??
      photo
        .parentElement!.querySelector<HTMLAnchorElement>('.post-media__open')
        ?.getAttribute('href'),
  };
}
