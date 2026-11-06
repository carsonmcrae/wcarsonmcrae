/**
 * Purpose: Distinguish actual page-scrolling gestures from layout and navigation movement.
 * Scope: Shared wheel, touch, keyboard, scrollbar, scroll-end, resize, and listener lifecycle.
 * Does NOT belong: Page/feed geometry, control visibility, persistence, or scrolling destinations.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
type ScrollWindow = Pick<Window, 'scrollY' | 'addEventListener' | 'removeEventListener'>;
export interface ScrollChange {
  user: boolean;
  delta: number;
}
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function isScrollLocked(doc: Document): boolean {
  return (
    doc.documentElement.dataset['menuOpen'] === 'true' || doc.querySelector('dialog[open]') !== null
  );
}

export function observeUserScroll(
  doc: Document,
  win: ScrollWindow,
  change: (value: ScrollChange) => void,
) {
  let user = false;
  let previous = win.scrollY;
  const refresh = () => {
    const next = win.scrollY;
    change({ user: user && !isScrollLocked(doc), delta: next - previous });
    previous = next;
  };
  const arm = () => {
    user = !isScrollLocked(doc);
  };
  const disarm = () => {
    user = false;
  };
  const key = (event: KeyboardEvent) => {
    user =
      !isScrollLocked(doc) &&
      SCROLL_KEYS.has(event.key) &&
      !(
        event.target instanceof Element &&
        event.target.closest('input,select,textarea,button,[contenteditable]')
      );
  };
  const pointer = (event: PointerEvent) => {
    user =
      !isScrollLocked(doc) &&
      event.target === doc.documentElement &&
      event.clientX >= doc.documentElement.clientWidth;
  };
  const resize = () => {
    disarm();
    refresh();
  };
  win.addEventListener('wheel', arm, { passive: true });
  win.addEventListener('touchmove', arm, { passive: true });
  win.addEventListener('keydown', key);
  win.addEventListener('pointerdown', pointer);
  win.addEventListener('scroll', refresh, { passive: true });
  win.addEventListener('scrollend', disarm);
  win.addEventListener('resize', resize);
  return {
    refresh,
    destroy: () => {
      win.removeEventListener('wheel', arm);
      win.removeEventListener('touchmove', arm);
      win.removeEventListener('keydown', key);
      win.removeEventListener('pointerdown', pointer);
      win.removeEventListener('scroll', refresh);
      win.removeEventListener('scrollend', disarm);
      win.removeEventListener('resize', resize);
    },
  };
}
