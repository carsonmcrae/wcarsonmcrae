/**
 * Purpose: Verify public build attribution cannot leak arbitrary environment strings.
 * Scope: Local builds, exact source commits, malformed inputs, and the static JSON endpoint.
 * Does NOT belong: Claiming a publication exists or inspecting live hosting configuration.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { buildIdentity } from '../../src/lib/build-identity';
import { releaseVersion } from '../../src/lib/release-identity';
import { GET } from '../../src/pages/build.json';

afterEach(() => vi.unstubAllEnvs());

it('distinguishes local output from an attributed source build', () => {
  expect(buildIdentity(undefined)).toEqual({ version: releaseVersion, source: 'local' });
  expect(buildIdentity('AB'.repeat(20))).toEqual({
    version: releaseVersion,
    source: 'ab'.repeat(20),
  });
});

it.each(['', 'short', 'secret=value', 'a'.repeat(39), 'a'.repeat(41), 'g'.repeat(40)])(
  'rejects malformed build attribution %s',
  (value) => expect(() => buildIdentity(value)).toThrow('SOURCE_COMMIT'),
);

it('publishes only the source and version as static JSON', async () => {
  vi.stubEnv('SOURCE_COMMIT', 'a'.repeat(40));
  const response = GET();
  expect(response.headers.get('Content-Type')).toContain('application/json');
  expect(await response.json()).toEqual({ version: releaseVersion, source: 'a'.repeat(40) });
});
