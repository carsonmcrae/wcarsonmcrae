/**
 * Purpose: Unit tests for src/lib/storage.ts.
 * Scope: Reading and writing through available, missing, and throwing storage.
 * Does NOT belong: Theme or achievement behavior (their own test files).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { readItem, safeStorage, writeItem } from '../../src/lib/storage';
import { memoryStorage, throwingStorage } from './helpers';

describe('safeStorage', () => {
  it('returns localStorage when it is accessible', () => {
    const storage = memoryStorage();
    expect(safeStorage({ localStorage: storage })).toBe(storage);
  });

  it('returns null when accessing localStorage throws', () => {
    const win = Object.defineProperty({}, 'localStorage', {
      get() {
        throw new Error('SecurityError');
      },
    }) as Pick<Window, 'localStorage'>;
    expect(safeStorage(win)).toBeNull();
  });
});

describe('readItem and writeItem', () => {
  it('round-trips values', () => {
    const storage = memoryStorage();
    expect(writeItem(storage, 'k', 'v')).toBe(true);
    expect(readItem(storage, 'k')).toBe('v');
    expect(readItem(storage, 'missing')).toBeNull();
  });

  it('degrades gracefully without storage', () => {
    expect(readItem(null, 'k')).toBeNull();
    expect(writeItem(null, 'k', 'v')).toBe(false);
  });

  it('degrades gracefully when storage throws', () => {
    const storage = throwingStorage();
    expect(readItem(storage, 'k')).toBeNull();
    expect(writeItem(storage, 'k', 'v')).toBe(false);
  });
});
