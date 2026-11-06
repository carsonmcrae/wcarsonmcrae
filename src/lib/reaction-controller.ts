/**
 * Purpose: Share consent-aware permanent reaction operations across moments and photographs.
 * Scope: Visitor identity, confirmed session choices, validated requests, and concurrent same-key deduplication.
 * Does NOT belong: DOM rendering, Save/Copy actions, announcements, or database abuse limits.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { ReactionKind } from '../data/reactions';
import { preferenceStorage } from './consent';
import { loadReactionCounts, submitReaction } from './reaction-api';
import { reactionKey } from './reaction-keys';
import { readItem, writeItem, type StorageLike } from './storage';
import { hasStoredReaction } from './reaction-choice';

interface ReactionWindow {
  localStorage: Storage;
  crypto: Pick<Crypto, 'randomUUID'>;
  fetch: typeof fetch;
}
export type ReactionResult =
  | { status: 'added'; key: string; count: number }
  | { status: 'duplicate' | 'unavailable' | 'storage' | 'failed' };

function visitorIdentity(storage: StorageLike, randomId: () => string): string | null {
  const existing = readItem(storage, 'daysforth.visitor');
  if (existing && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(existing)) return existing;
  const id = randomId();
  return writeItem(storage, 'daysforth.visitor', id) ? id : null;
}

export function createReactionController(
  win: ReactionWindow,
  endpoint: string,
  storage = preferenceStorage(win),
) {
  const pending = new Set<string>();
  const successful = new Map<string, string>();
  const hasReacted = (id: string, kind: ReactionKind) =>
    hasStoredReaction(storage, id, kind) ||
    successful.get(reactionKey(id, kind)) === readItem(storage, 'daysforth.visitor');
  return {
    storage,
    hasReacted,
    load: () => loadReactionCounts(endpoint, win.fetch),
    async react(id: string, kind: ReactionKind): Promise<ReactionResult> {
      const key = reactionKey(id, kind);
      if (hasReacted(id, kind) || pending.has(key)) return { status: 'duplicate' };
      if (!endpoint) return { status: 'unavailable' };
      try {
        const visitor = visitorIdentity(storage, () => win.crypto.randomUUID());
        if (!visitor) return { status: 'storage' };
        pending.add(key);
        const count = await submitReaction(endpoint, key, visitor, win.fetch);
        // A completed request must not repopulate preferences after the browser was forgotten.
        if (readItem(storage, 'daysforth.visitor') === visitor) {
          successful.set(key, visitor);
          writeItem(storage, `daysforth.reacted.${key}`, 'true');
        }
        return { status: 'added', key, count };
      } catch {
        return { status: 'failed' };
      } finally {
        pending.delete(key);
      }
    },
  };
}
