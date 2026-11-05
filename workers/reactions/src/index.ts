/**
 * Purpose: Cloudflare Worker entry point for Daysforth shared reactions.
 * Scope: Passes platform bindings and approved moment/image keys to the tested HTTP service.
 * Does NOT belong: HTTP, SQL, validation, or rate-limit logic (src/lib/reaction-service.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { supportedReactionKeys } from '../../../src/data/reaction-targets';
import {
  cleanupReactionLimits,
  handleReactions,
  type ReactionEnvironment,
} from '../../../src/lib/reaction-service';
export default {
  fetch(request: Request, env: ReactionEnvironment) {
    return handleReactions(request, env, supportedReactionKeys);
  },
  async scheduled(_event: unknown, env: ReactionEnvironment) {
    await cleanupReactionLimits(env.DB!, Date.now());
  },
};
