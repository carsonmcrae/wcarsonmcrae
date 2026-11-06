/**
 * Purpose: The browser entry point for progressive enhancements in the shared page shell.
 * Scope: Theme, history, departure positions, native disclosures, privacy, images, and intent-loaded dialogs.
 * Constraints: Everything here is optional: every page is readable and navigable without
 *   JavaScript.
 * Does NOT belong: The behaviors themselves, which live (and are tested) in src/lib.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initImageFallbacks } from '../lib/image-fallbacks';
import { initThemeToggle } from '../lib/theme';
import { initHistoryControls } from '../lib/history-controls';
import { reactionEndpoint } from '../lib/reaction-endpoint';
import { initDisclosures } from '../lib/disclosures';
import { initPagePosition, releaseTimelineRestore } from '../lib/page-position';
import { deferControl } from '../lib/deferred-controls';
import { consentChoice } from '../lib/consent';
import { safeStorage } from '../lib/storage';
import { startBrowserFeature, type BrowserComponent } from '../lib/browser-diagnostics';

const start = () => {
  const mount = (component: BrowserComponent, initialize: () => void | (() => void)) =>
    startBrowserFeature(document, component, initialize);
  const stops = [
    mount('theme', () => initThemeToggle(document, globalThis)),
    mount('history', () => initHistoryControls(document, globalThis)),
    mount('navigation', () => initDisclosures(document)),
  ];
  stops.push(
    deferControl(
      document,
      '[data-photo]',
      async () => {
        const { initPhotoViewer } = await import('../lib/photo-viewer');
        const cleanup = initPhotoViewer(
          document,
          reactionEndpoint(import.meta.env.PUBLIC_REACTIONS_URL),
        );
        delete document.documentElement.dataset['photoFallback'];
        return cleanup;
      },
      {
        component: 'photo',
        fallback: () => {
          document.documentElement.dataset['photoFallback'] = '';
        },
      },
    ),
    deferControl(
      document,
      '[data-storage-open],[data-storage-choice],[data-forget-browser]',
      async () => {
        const { initPrivacyControls } = await import('../lib/privacy-controls');
        return initPrivacyControls(
          document,
          globalThis,
          reactionEndpoint(import.meta.env.PUBLIC_REACTIONS_URL),
        );
      },
      { request: 'daysforth:privacy-request', component: 'privacy' },
    ),
    deferControl(
      document,
      '[data-menu-toggle]',
      async () => {
        const { initMenu } = await import('../lib/menu');
        const menu = initMenu(document, globalThis)!;
        const cleanup = menu.destroy;
        delete document.documentElement.dataset['menuFallback'];
        return cleanup;
      },
      {
        edge: true,
        component: 'menu',
        fallback: () => {
          document.documentElement.dataset['menuFallback'] = '';
        },
      },
    ),
    mount('navigation', () => initPagePosition(document, globalThis)),
  );
  mount('privacy', () => {
    document.querySelector<HTMLElement>('[data-storage-notice]')!.hidden =
      consentChoice(safeStorage(globalThis)) !== null;
  });
  mount('images', () => {
    initImageFallbacks(document);
  });
  document.documentElement.classList.add('js');
  document.documentElement.dataset['siteReady'] = 'true';
  if (!document.querySelector('[data-timeline]')) releaseTimelineRestore(document);
  return () => {
    for (const stop of stops) stop();
  };
};
export const stopSite = start();
