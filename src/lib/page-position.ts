/**
 * Purpose: Return to the exact browser-history entry instead of reloading the timeline at its top.
 * Scope: Native back/forward cache, browser-owned scroll state, and a safe direct-link fallback.
 * Does NOT belong: Persistent browser storage, server-side history, or service workers.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
type PositionWindow = Pick<Window, 'history' | 'location' | 'scrollY'> & {
  navigation?: {
    currentEntry: { index: number } | null;
    entries(): { index: number; url: string | null }[];
  };
};
export function prepareTimelineRestore(win: Pick<Window, 'history'>): number | null {
  const position: unknown = win.history.state?.scrollY;
  if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) return null;
  // A fresh document owns this restore; native restoration must not race the hydrated layout.
  win.history.scrollRestoration = 'manual';
  return position;
}
export function initPagePosition(doc: Document, win: PositionWindow) {
  const remember = () =>
    win.history.replaceState({ ...win.history.state, scrollY: win.scrollY }, '');
  const click = (event: MouseEvent) => {
    if (
      !(event.target instanceof Element) ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (event.target.closest('a[href],button[data-history]')) remember();
    const link = event.target.closest<HTMLAnchorElement>('[data-return-timeline]');
    if (!link || win.history.length < 2) return;
    const index = win.navigation?.currentEntry?.index ?? 0;
    const previousUrl =
      win.navigation?.entries().find((entry) => entry.index === index - 1)?.url ?? doc.referrer;
    if (!previousUrl) return;
    const previous = new URL(previousUrl);
    const destination = new URL(link.href);
    if (previous.origin === win.location.origin && previous.pathname === destination.pathname) {
      event.preventDefault();
      win.history.back();
    }
  };
  doc.addEventListener('click', click, true);
  return () => {
    doc.removeEventListener('click', click, true);
  };
}
