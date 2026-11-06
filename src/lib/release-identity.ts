/**
 * Purpose: Expose the canonical product release without importing authored release history.
 * Scope: A shared immutable version for browser, build, and Worker attribution.
 * Does NOT belong: Deployment state, timestamps, or visitor information.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import manifest from '../../package.json' with { type: 'json' };

// Astro folds this constant and removes the manifest from browser chunks. Other runtime
// bundlers and native Node retain the standard default JSON import as their source of truth.
declare const __DAYSFORTH_RELEASE__: string | undefined;
export const releaseVersion =
  typeof __DAYSFORTH_RELEASE__ === 'undefined' ? manifest.version : __DAYSFORTH_RELEASE__;
