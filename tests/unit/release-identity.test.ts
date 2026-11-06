/**
 * Purpose: Verify one canonical release works with browser constant folding and native JSON loaders.
 * Scope: Build-supplied constants and the Worker/Node manifest fallback without importing history.
 * Does NOT belong: A second version setting or deployment attribution.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import manifest from '../../package.json' with { type: 'json' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('reads the canonical manifest in native runtimes without a build constant', async () => {
  expect((await import('../../src/lib/release-identity')).releaseVersion).toBe(manifest.version);
});

it('uses the injected release constant in browser builds', async () => {
  vi.stubGlobal('__DAYSFORTH_RELEASE__', 'build-fixture');
  expect((await import('../../src/lib/release-identity')).releaseVersion).toBe('build-fixture');
});
