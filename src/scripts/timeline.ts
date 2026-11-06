/**
 * Purpose: Starts optional Daysforth feed enhancements.
 * Scope: Feed navigation, media reveal, native-menu dismissal, and optional intent-loaded post actions.
 * Does NOT belong: Behavior implementations (src/lib).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initDisclosures } from '../lib/disclosures';
import { initPostActions } from '../lib/post-actions';
import { reactionEndpoint } from '../lib/reaction-api';
import { deferControl } from '../lib/deferred-controls';
import { initTimelineJumps } from '../lib/timeline-jumps';
import { initMediaAffordances } from '../lib/media-affordances';
import { initMomentNavigator } from '../lib/moment-navigator';
export function startTimeline() {
  const stops = [
    initDisclosures(document),
    initTimelineJumps(document, globalThis),
    initMediaAffordances(document, globalThis),
    initMomentNavigator(document, globalThis),
  ];
  if (document.querySelector('[data-action-notice]')) {
    const endpoint = reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']);
    const state = initPostActions(document, globalThis, endpoint);
    let activate: (target: Element) => Promise<void>;
    const stopActions = deferControl(
      document,
      '[data-post-actions] button',
      async () => {
        const [{ attachPostActionEvents }, { initActionNotice }] = await Promise.all([
          import('../lib/post-action-events'),
          import('../lib/notices'),
        ]);
        const notice = initActionNotice(document, globalThis);
        const events = attachPostActionEvents(document, globalThis, endpoint, state, notice.show);
        activate = events.activate;
        return () => {
          notice.destroy();
          events.destroy();
        };
      },
      // deferControl initializes the adapter before delivering each buffered command.
      { activate: (target) => void activate(target) },
    );
    stops.push(stopActions, state.destroy);
  }
  return () => {
    for (const stop of stops) stop();
  };
}
