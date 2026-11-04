/**
 * Purpose: Cloudflare Worker entry point for Daysforth shared reactions.
 * Scope: Passes platform bindings and approved moment IDs to the tested HTTP service.
 * Does NOT belong: HTTP, SQL, validation, or rate-limit logic (src/lib/reaction-service.ts).
 */
import { timelinePosts } from '../../../src/data/timeline';
import {
  cleanupReactionLimits,
  handleReactions,
  type ReactionEnvironment,
} from '../../../src/lib/reaction-service';
const ids = timelinePosts.map((post) => post.id);
export default {
  fetch(request: Request, env: ReactionEnvironment) {
    return handleReactions(request, env, ids);
  },
  async scheduled(_event: unknown, env: ReactionEnvironment) {
    await cleanupReactionLimits(env.DB!, Date.now());
  },
};
