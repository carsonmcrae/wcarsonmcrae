/**
 * Purpose: Mount touch-media affordances only on pages rendering post/project media.
 * Scope: Isolated startup and cleanup for the PostMedia component.
 * Does NOT belong: The photo viewer, content, or global shell.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initMediaAffordances } from '../lib/media-affordances';
import { startBrowserFeature } from '../lib/browser-diagnostics';

export function startMediaAffordances() {
  return startBrowserFeature(document, 'images', () => initMediaAffordances(document, globalThis));
}
