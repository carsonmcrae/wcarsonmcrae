/**
 * Purpose: Cloudflare Worker entry point for Daysforth shared reactions.
 * Scope: Passes platform bindings and approved moment IDs to the tested HTTP service.
 * Does NOT belong: HTTP, SQL, validation, or rate-limit logic (src/lib/reaction-service.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { timelinePosts } from '../../../src/data/timeline';
import { postAliases } from '../../../src/data/post-aliases';
import { reactionKeys } from '../../../src/lib/reaction-keys';
import {
  cleanupReactionLimits,
  handleReactions,
  type ReactionEnvironment,
} from '../../../src/lib/reaction-service';
const ids = reactionKeys([...timelinePosts.map((post) => post.id), ...Object.keys(postAliases)]);
export default {
  fetch(request: Request, env: ReactionEnvironment) {
    return handleReactions(request, env, ids);
  },
  async scheduled(_event: unknown, env: ReactionEnvironment) {
    await cleanupReactionLimits(env.DB!, Date.now());
  },
};
