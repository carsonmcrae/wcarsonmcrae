/**
 * Purpose: Mount interactive browsing after real timeline intent without coupling optional controls.
 * Scope: Core commands, native-gesture shortcut handoff, optional desktop navigation, and cleanup.
 * Does NOT belong: Initial monthly painting, loading triggers, or saved preferences.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initTimeline } from './timeline-controller';
import { initTimelineJumps } from './timeline-jumps';
import { reportBrowserFailure, startBrowserFeature } from './browser-diagnostics';
import type { ScrollChange } from './scroll-intent';
import type * as NavigatorModule from './moment-navigator';

export function mountInteractiveTimeline(
  doc: Document,
  win: Window,
  initial: ScrollChange,
  desktop: MediaQueryList | null,
  preservePosition: boolean,
  navigation?: Promise<typeof NavigatorModule | null>,
) {
  const controller = initTimeline(doc, win, { preservePosition })!;
  const stopJumps = startBrowserFeature(doc, 'timeline', () =>
    initTimelineJumps(doc, win, initial),
  );
  let disposed = false;
  let stopNavigator: (() => void) | undefined;
  const navigator = () => {
    if (!desktop?.matches) return;
    desktop.removeEventListener('change', navigator);
    void (navigation ?? import('./moment-navigator'))
      .then((module) => {
        if (module && !disposed)
          stopNavigator = startBrowserFeature(doc, 'timeline', () =>
            module.initMomentNavigator(doc, win),
          );
      })
      .catch(() => {
        if (!disposed) reportBrowserFailure(doc, 'timeline', 'load');
      });
  };
  desktop?.addEventListener('change', navigator);
  navigator();
  return {
    ...controller,
    destroy: () => {
      disposed = true;
      controller.destroy();
      stopJumps();
      stopNavigator?.();
      desktop?.removeEventListener('change', navigator);
    },
  };
}
