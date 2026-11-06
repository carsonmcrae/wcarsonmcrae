/**
 * Purpose: Mount social controls only on pages that actually render moment actions.
 * Scope: Immediate remembered choices, visibility/intent-loaded controls, and document cleanup.
 * Does NOT belong: Global shell, timeline browsing, or secondary-page navigation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initActionChoices } from '../lib/action-choices';
import { reactionEndpoint } from '../lib/reaction-endpoint';
import { deferControl } from '../lib/deferred-controls';
import { startBrowserFeature } from '../lib/browser-diagnostics';
const mounted = new WeakMap<Document, () => void>();

export function startPostActions() {
  const existing = mounted.get(document);
  if (existing) return existing;
  const cleanup = startBrowserFeature(document, 'post-actions', () => {
    if (!document.querySelector('[data-action-notice]')) return;
    const endpoint = reactionEndpoint(import.meta.env.PUBLIC_REACTIONS_URL);
    const choices = initActionChoices(document, globalThis);
    let disposed = false;
    let activate: (target: Element) => Promise<void>;
    const stopActions = deferControl(
      document,
      '[data-post-actions] button',
      async () => {
        const { initPostEnhancements } = await import('../lib/post-enhancements');
        if (disposed) return () => {};
        const enhanced = initPostEnhancements(document, globalThis, endpoint, choices);
        activate = enhanced.activate;
        return enhanced.destroy;
      },
      { activate: (target) => activate(target), component: 'post-actions' },
    );
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            if (!disposed && entries.some((entry) => entry.isIntersecting)) {
              observer!.disconnect();
              void stopActions.preload();
            }
          })
        : null;
    if (observer) for (const row of choices.rows) observer.observe(row);
    else void stopActions.preload();
    return () => {
      disposed = true;
      stopActions();
      observer?.disconnect();
      choices.destroy();
    };
  });
  const stop = () => {
    cleanup();
    if (mounted.get(document) === stop) mounted.delete(document);
  };
  mounted.set(document, stop);
  return stop;
}
