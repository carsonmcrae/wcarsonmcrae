/**
 * Purpose: Starts optional Daysforth feed enhancements.
 * Scope: Timeline browsing, native-menu dismissal, and shared post actions.
 * Does NOT belong: Behavior implementations (src/lib).
 */
import { initDisclosures } from '../lib/disclosures';
import { initTimeline } from '../lib/timeline-controller';
import { initActionNotice } from '../lib/notices';
import { initPostActions } from '../lib/post-actions';
import { reactionEndpoint } from '../lib/reaction-api';
import { initPostNavigation } from '../lib/post-navigation';
initDisclosures(document);
const notice = initActionNotice(document, window);
void initPostActions(
  document,
  window,
  reactionEndpoint(import.meta.env['PUBLIC_REACTIONS_URL']),
  notice.show,
);
initTimeline(document, window);
initPostNavigation(document, (href) => window.location.assign(href));
