/**
 * Purpose: Keep browser-owned timeline positions stable across native history traversal.
 * Scope: Timeline restoration ownership, pre-traversal snapshots, and validated entry coordinates.
 * Does NOT belong: Post return-link behavior (post-navigation.ts), persistent storage, or server history.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clickedControl } from './click-intent';
interface PositionNavigation extends EventTarget {
  currentEntry: { index: number; getState(): Record<string, unknown> | undefined } | null;
  entries(): { index: number; url: string | null }[];
  updateCurrentEntry(options: { state: Record<string, unknown> }): void;
}
export type PositionWindow = Pick<Window, 'history' | 'location' | 'scrollY'> & {
  navigation?: PositionNavigation;
};
export function prepareTimelineRestore(
  win: Pick<PositionWindow, 'history' | 'navigation'>,
): number | null {
  const position: unknown =
    win.navigation?.currentEntry?.getState()?.['scrollY'] ?? win.history.state?.scrollY;
  if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) return null;
  // A fresh document owns this restore; native restoration must not race the hydrated layout.
  win.history.scrollRestoration = 'manual';
  return position;
}
function snapshotDepartures(navigation: PositionNavigation, win: Pick<Window, 'scrollY'>) {
  const snapshot = (event: Event) => {
    if ((event as NavigateEvent).navigationType === 'replace') return;
    // Entry state can change during navigation without starting another navigation.
    navigation.updateCurrentEntry({
      state: { ...navigation.currentEntry?.getState(), scrollY: win.scrollY },
    });
  };
  navigation.addEventListener('navigate', snapshot);
  return () => navigation.removeEventListener('navigate', snapshot);
}
export function initPagePosition(doc: Document, win: PositionWindow) {
  const remember = () =>
    win.history.replaceState({ ...win.history.state, scrollY: win.scrollY }, '');
  const timeline = doc.querySelector('[data-timeline]') !== null;
  const navigation = win.navigation;
  const stopSnapshots = timeline && navigation ? snapshotDepartures(navigation, win) : null;
  if (timeline) {
    // Ownership belongs to this history entry before a future Back traversal can begin.
    win.history.scrollRestoration = 'manual';
  }
  const click = (event: MouseEvent) => {
    if (clickedControl(event, 'a[href],button[data-history]')) remember();
  };
  doc.addEventListener('click', click, true);
  return () => {
    doc.removeEventListener('click', click, true);
    stopSnapshots?.();
  };
}
