/**
 * Purpose: Starts optional Daysforth feed enhancements.
 * Scope: Native-menu dismissal, initial shared counts, and post actions loaded on intent.
 * Does NOT belong: Behavior implementations (src/lib).
 */
import { initDisclosures } from '../lib/disclosures';
import { initPostActions } from '../lib/post-actions';
import { reactionEndpoint } from '../lib/reaction-api';
import { deferControl } from '../lib/deferred-controls';
export function startTimeline() {
  const stopMenus = initDisclosures(document);
  if (!document.querySelector('[data-action-notice]')) return stopMenus;
  const endpoint = reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']);
  const state = initPostActions(document, window, endpoint);
  const stopActions = deferControl(document, '[data-post-actions] button', async () => {
    const [{ attachPostActionEvents }, { initActionNotice }] = await Promise.all([
      import('../lib/post-action-events'),
      import('../lib/notices'),
    ]);
    const notice = initActionNotice(document, window);
    const stop = attachPostActionEvents(document, window, endpoint, state, notice.show);
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
