/**
 * Purpose: The browser entry point for the site's progressive enhancements.
 * Scope: Starts theme, history, feed, privacy, and image controls with dialogs loaded on intent.
 * Constraints: Everything here is optional: every page is readable and navigable without
 *   JavaScript.
 * Does NOT belong: The behaviors themselves, which live (and are tested) in src/lib.
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
  initThemeToggle(document, window);
  initHistoryControls(document, window);
  deferControl(document, '[data-photo]', async () => {
    const { initPhotoViewer } = await import('../lib/photo-viewer');
    return initPhotoViewer(document);
  });
  deferControl(
    document,
    '[data-storage-open],[data-storage-choice],[data-forget-browser]',
    async () => {
      const { initPrivacyControls } = await import('../lib/privacy-controls');
      return initPrivacyControls(
        document,
        window,
        reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']),
      );
    },
    { request: 'daysforth:privacy-request' },
  );
  deferControl(
    document,
    '[data-menu-toggle]',
    async () => {
      const { initMenu } = await import('../lib/menu');
      return initMenu(document, window)!.destroy;
    },
    { edge: true },
  );
  initPagePosition(document, window);
  document.querySelector<HTMLElement>('[data-storage-notice]')!.hidden =
    consentChoice(safeStorage(window)) !== null;
  initImageFallbacks(document);
  startTimeline();
  document.documentElement.dataset['siteReady'] = 'true';
  if (!document.querySelector('[data-timeline]'))
    document.documentElement.removeAttribute('data-timeline-restore');
};
start();
