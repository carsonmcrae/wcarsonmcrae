/**
 * Purpose: Keep saved app events useful after start/release consolidation.
 * Scope: One-time browser-local migration from old post IDs to their release IDs.
 * Does NOT belong: Network persistence or deleting the original saved keys.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { postAliases } from '../data/post-aliases';
import { readItem, writeItem, type StorageLike } from './storage';
export function migrateSavedMoments(storage: StorageLike | null) {
  if (readItem(storage, 'daysforth.saved-migration.v1') === 'true') return;
  for (const [from, to] of Object.entries(postAliases)) {
    if (
      readItem(storage, `daysforth.saved.${from}`) === 'true' &&
      !writeItem(storage, `daysforth.saved.${to}`, 'true')
    )
      return;
  }
  writeItem(storage, 'daysforth.saved-migration.v1', 'true');
}
