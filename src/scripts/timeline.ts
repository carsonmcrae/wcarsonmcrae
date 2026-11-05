/**
 * Purpose: Starts optional Daysforth feed enhancements.
 * Scope: Native-menu dismissal, initial shared counts, and post actions loaded on intent.
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
  const destroy = () => {
    for (const stop of stops) stop();
  };
  if (!document.querySelector('[data-action-notice]')) return destroy;
  const endpoint = reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']);
  const state = initPostActions(document, globalThis, endpoint);
  const stopActions = deferControl(document, '[data-post-actions] button', async () => {
    const [{ attachPostActionEvents }, { initActionNotice }] = await Promise.all([
      import('../lib/post-action-events'),
      import('../lib/notices'),
    ]);
    const notice = initActionNotice(document, globalThis);
    const stop = attachPostActionEvents(document, globalThis, endpoint, state, notice.show);
    return () => {
      notice.destroy();
      stop();
    };
  });
  stops.push(stopActions, state.destroy);
  return destroy;
}
