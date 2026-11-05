/**
 * Purpose: Share the feed's visible reading region between timeline navigation enhancements.
 * Scope: Header/dock clearance, nonempty feed entry, and content-edge geometry.
 * Does NOT belong: User intent, navigation controls, or timeline state changes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function readTimelineViewport(root: HTMLElement, win: Pick<Window, 'innerHeight'>) {
  const header = root.ownerDocument
    .querySelector<HTMLElement>('.site-header')!
    .getBoundingClientRect();
  const dock = root.querySelector<HTMLElement>('.timeline-dock')!.getBoundingClientRect();
  const content = root
    .querySelector<HTMLElement>('[data-timeline-groups]')!
    .getBoundingClientRect();
  const feed = root.getBoundingClientRect();
  const headerBottom = Math.max(0, header.bottom);
  const readingTop = Math.max(headerBottom, dock.bottom);
  return {
    inside: feed.top <= headerBottom && feed.bottom > readingTop && content.height > 0,
    atStart: content.top >= readingTop - 1,
    atEnd: content.bottom <= win.innerHeight + 1,
    readingTop,
    dockVisible: dock.bottom > headerBottom,
  };
}
