/**
 * Purpose: Mount secondary-page shortcuts only where their buttons are rendered.
 * Scope: Isolated startup and cleanup for the PageJumps component.
 * Does NOT belong: Timeline geometry or the global page shell.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initPageJumps } from '../lib/page-jumps';
import { startBrowserFeature } from '../lib/browser-diagnostics';

export function startPageJumps() {
  return startBrowserFeature(document, 'navigation', () => initPageJumps(document, globalThis));
}
