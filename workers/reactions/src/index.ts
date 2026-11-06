/**
 * Purpose: Cloudflare Worker entry point for Daysforth shared reactions.
 * Scope: Passes platform bindings and approved keys to the service; identifies the serving artifact.
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

interface WorkerEnvironment extends ReactionEnvironment {
  CF_VERSION_METADATA?: { id: string };
}
export default {
  async fetch(request: Request, env: WorkerEnvironment) {
    const response = await handleReactions(request, env, supportedReactionKeys);
    const version = env.CF_VERSION_METADATA?.id ?? '';
    response.headers.set(
      'X-Daysforth-Worker-Version',
      /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(version) ? version : 'unavailable',
    );
    return response;
  },
  async scheduled(_event: unknown, env: ReactionEnvironment) {
    await cleanupReactionLimits(env.DB!, Date.now());
  },
};
