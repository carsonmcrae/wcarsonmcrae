/**
 * Purpose: Offer timeline edge shortcuts only after an actual user scroll into the feed.
 * Scope: Scroll intent qualification, shared reading geometry, edge visibility, and cleanup.
 * Does NOT belong: Date navigation or programmatic scroll restoration.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readTimelineViewport } from './timeline-viewport';
type JumpWindow = Pick<
  Window,
  'innerHeight' | 'scrollY' | 'addEventListener' | 'removeEventListener'
>;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function initTimelineJumps(doc: Document, win: JumpWindow): () => void {
  const root = doc.querySelector<HTMLElement>('[data-timeline]');
  const group = doc.querySelector<HTMLElement>('.timeline-jumps');
  if (!root || !group) return () => {};
  const up = group.querySelector<HTMLButtonElement>('[data-timeline-edge="newest"]')!;
  const down = group.querySelector<HTMLButtonElement>('[data-timeline-edge="oldest"]')!;
  let userScroll = false;
  let qualified = false;
  let previous = win.scrollY;
  const update = () => {
    const view = readTimelineViewport(root, win);
    if (!view.inside && userScroll) qualified = false;
    if (view.inside && userScroll && previous !== win.scrollY) qualified = true;
    previous = win.scrollY;
    up.hidden = !view.inside || !qualified || view.atStart;
    down.hidden = !view.inside || !qualified || view.atEnd;
    group.hidden = up.hidden && down.hidden;
  };
  const arm = () => {
    userScroll = true;
  };
  const disarm = () => {
    userScroll = false;
  };
  const key = (event: KeyboardEvent) => {
    userScroll =
      SCROLL_KEYS.has(event.key) &&
      !(
        event.target instanceof Element &&
        event.target.closest('input,select,textarea,button,[contenteditable]')
      );
  };
  const pointer = (event: PointerEvent) => {
    userScroll =
      event.target === doc.documentElement && event.clientX >= doc.documentElement.clientWidth;
  };
  const resize = () => {
    disarm();
    update();
  };
  win.addEventListener('wheel', arm, { passive: true });
  win.addEventListener('touchmove', arm, { passive: true });
  win.addEventListener('keydown', key);
  win.addEventListener('pointerdown', pointer);
  win.addEventListener('scroll', update, { passive: true });
  win.addEventListener('scrollend', disarm);
  win.addEventListener('resize', resize);
  doc.addEventListener('daysforth:history', update);
  update();
  return () => {
    win.removeEventListener('wheel', arm);
    win.removeEventListener('touchmove', arm);
    win.removeEventListener('keydown', key);
    win.removeEventListener('pointerdown', pointer);
    win.removeEventListener('scroll', update);
    win.removeEventListener('scrollend', disarm);
    win.removeEventListener('resize', resize);
    doc.removeEventListener('daysforth:history', update);
    group.hidden = true;
  };
}
