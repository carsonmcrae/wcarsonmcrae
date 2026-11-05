/**
 * Purpose: The browser entry point for the site's progressive enhancements.
 * Scope: Composes theme, history, feed, privacy, image controls, and cleanup with dialogs loaded on intent.
 * Constraints: Everything here is optional: every page is readable and navigable without
 *   JavaScript.
 * Does NOT belong: The behaviors themselves, which live (and are tested) in src/lib.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initImageFallbacks } from '../lib/image-fallbacks';
import { initThemeToggle } from '../lib/theme';
import { initHistoryControls } from '../lib/history-controls';
import { reactionEndpoint } from '../lib/reaction-api';
import { startTimeline } from './timeline';
import { initPagePosition } from '../lib/page-position';
import { deferControl } from '../lib/deferred-controls';
import { consentChoice } from '../lib/consent';
import { safeStorage } from '../lib/storage';

const start = () => {
  const stops = [initThemeToggle(document, globalThis), initHistoryControls(document, globalThis)];
  stops.push(
    deferControl(document, '[data-photo]', async () => {
      const { initPhotoViewer } = await import('../lib/photo-viewer');
      return initPhotoViewer(document);
    }),
    deferControl(
      document,
      '[data-storage-open],[data-storage-choice],[data-forget-browser]',
      async () => {
        const { initPrivacyControls } = await import('../lib/privacy-controls');
        return initPrivacyControls(
          document,
          globalThis,
          reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']),
        );
      },
      { request: 'daysforth:privacy-request' },
    ),
    deferControl(
      document,
      '[data-menu-toggle]',
      async () => {
        const { initMenu } = await import('../lib/menu');
        return initMenu(document, globalThis)!.destroy;
      },
      { edge: true },
    ),
    initPagePosition(document, globalThis),
  );
  document.querySelector<HTMLElement>('[data-storage-notice]')!.hidden =
    consentChoice(safeStorage(globalThis)) !== null;
  initImageFallbacks(document);
  stops.push(startTimeline());
  document.documentElement.dataset['siteReady'] = 'true';
  if (!document.querySelector('[data-timeline]'))
    delete document.documentElement.dataset['timelineRestore'];
  return () => {
    for (const stop of stops) stop();
  };
};
export const stopSite = start();
