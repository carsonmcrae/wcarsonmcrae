/**
 * Purpose: Offer timeline edge shortcuts only after an actual user scroll into the feed.
 * Scope: Scroll intent qualification, dock-relative placement, useful directions, and cleanup.
 * Does NOT belong: Date navigation or programmatic scroll restoration.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readTimelineViewport } from './timeline-viewport';
import { isScrollLocked, observeUserScroll, type ScrollChange } from './scroll-intent';
type JumpWindow = Pick<
  Window,
  'innerHeight' | 'scrollY' | 'addEventListener' | 'removeEventListener'
>;

export function initTimelineJumps(doc: Document, win: JumpWindow): () => void {
  const root = doc.querySelector<HTMLElement>('[data-timeline]');
  const up = doc.querySelector<HTMLButtonElement>('[data-timeline-edge="newest"]');
  const down = doc.querySelector<HTMLButtonElement>('[data-timeline-edge="oldest"]');
  if (!root || !up || !down) return () => {};
  const dockSlot = up.parentElement!;
  const pageSlot = down.parentElement!;
  const position = (dockVisible: boolean) => {
    const slot = dockVisible ? dockSlot : pageSlot;
    if (up.parentElement !== slot) {
      const focused = doc.activeElement === up;
      slot.prepend(up);
      if (focused) up.focus({ preventScroll: true });
    }
    up.toggleAttribute('data-dock-detached', !dockVisible);
  };
  let qualified = false;
  const update = ({ user, delta }: ScrollChange) => {
    const view = readTimelineViewport(root, win);
    position(view.dockVisible);
    if (!view.inside && user) qualified = false;
    if (view.inside && user && delta !== 0) qualified = true;
    const unavailable = !view.inside || !qualified || isScrollLocked(doc);
    up.hidden = unavailable || view.atStart;
    down.hidden = unavailable || view.atEnd;
  };
  const intent = observeUserScroll(doc, win, update);
  doc.addEventListener('daysforth:history', intent.refresh);
  intent.refresh();
  return () => {
    intent.destroy();
    doc.removeEventListener('daysforth:history', intent.refresh);
    up.hidden = true;
    down.hidden = true;
    position(true);
  };
}
