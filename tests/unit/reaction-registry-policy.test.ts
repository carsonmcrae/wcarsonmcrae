/**
 * Purpose: Prevent loss or reuse of published image reaction identities during release preparation.
 * Scope: Append-only comparisons, malformed registries, duplicates, and initial adoption.
 * Does NOT belong: Production database reads or content presentation decisions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, it } from 'vitest';
import { checkPublishedImageIds } from '../../scripts/lib/reaction-registry-policy';

it('accepts initial adoption and compatible append-only updates', () => {
  expect(checkPublishedImageIds(['photo-family'])).toEqual([]);
  expect(checkPublishedImageIds(['photo-family', 'screen-app'], ['photo-family'])).toEqual([]);
});

it('reports every retired identity removed from the supported registry', () => {
  expect(checkPublishedImageIds(['photo-new'], ['photo-family', 'screen-app'])).toEqual([
    'Published image reaction identity must remain supported: photo-family.',
    'Published image reaction identity must remain supported: screen-app.',
  ]);
});

it.each([{}, null, [42], ['photo-a', 'photo-a'], ['post-a'], ['photo-../a']])(
  'rejects malformed current or base registries %j',
  (value) => {
    expect(checkPublishedImageIds(value)).toHaveLength(1);
    expect(checkPublishedImageIds([], value)).toHaveLength(1);
  },
);
