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
export function startTimeline() {
  const stopMenus = initDisclosures(document);
  if (!document.querySelector('[data-action-notice]')) return stopMenus;
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
  return () => {
    stopMenus();
    stopActions();
    state.destroy();
  };
}
