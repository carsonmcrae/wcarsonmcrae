/**
 * Purpose: Read a remembered reaction choice without loading mutation/identity operations.
 * Scope: The consent-aware storage flag shared by initial controls and explicit reaction commands.
 * Does NOT belong: Session-success fallback, network requests, or visitor identity generation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { ReactionKind } from '../data/reactions';
import { reactionKey } from './reaction-keys';
import { readItem, type StorageLike } from './storage';

export function hasStoredReaction(storage: StorageLike, id: string, kind: ReactionKind) {
  return readItem(storage, `daysforth.reacted.${reactionKey(id, kind)}`) === 'true';
}
