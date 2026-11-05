/**
 * Purpose: Preserve published start-event links after consolidating app release events.
 * Scope: Stable old post IDs mapped to their canonical release posts.
 * Does NOT belong: Event content or redirect rendering.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export const postAliases: Record<string, string> = {
  'ttsnative-started': 'ttsnative-1',
  'recalen-started': 'recalen-beta',
  'picpledge-started': 'picpledge-wedding',
};
