/**
 * Purpose: Keep optional browser persistence behind a clear, revocable choice.
 * Scope: A necessary consent record, consent-gated preferences, and memory-only fallback.
 * Does NOT belong: Consent dialog markup or server reaction totals.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readItem, safeStorage, writeItem, type StorageLike } from './storage';
export const CONSENT_KEY = 'daysforth.consent.v1';
const memory = new Map<string, string>();
const withdrawn = new WeakSet<StorageLike>();
export function consentChoice(storage: StorageLike | null, now = Date.now()): boolean | null {
  if (storage && withdrawn.has(storage)) return false;
  try {
    const value: unknown = JSON.parse(readItem(storage, CONSENT_KEY) ?? 'null');
    if (
      value &&
      typeof value === 'object' &&
      'allowed' in value &&
      typeof value.allowed === 'boolean' &&
      'expires' in value &&
      typeof value.expires === 'number' &&
      value.expires > now
    )
      return value.allowed;
  } catch {
    return null;
  }
  return null;
}
export function preferenceStorage(win: Pick<Window, 'localStorage'>): StorageLike {
  const storage = safeStorage(win);
  return {
    getItem: (key) =>
      consentChoice(storage) === true ? readItem(storage, key) : (memory.get(key) ?? null),
    setItem: (key, value) => {
      if (consentChoice(storage) === true) {
        if (!writeItem(storage, key, value)) throw new Error('Storage unavailable');
      } else memory.set(key, value);
    },
  };
}
export function recordConsent(storage: StorageLike | null, allowed: boolean, now = Date.now()) {
  if (storage && !allowed) withdrawn.add(storage);
  const recorded = writeItem(
    storage,
    CONSENT_KEY,
    JSON.stringify({ allowed, expires: now + 180 * 86400000 }),
  );
  if (recorded && storage && allowed) withdrawn.delete(storage);
  if (recorded && allowed)
    for (const [key, value] of memory)
      if (!writeItem(storage, key, value)) {
        recordConsent(storage, false, now);
        return false;
      }
  return recorded;
}
export function clearPreferences(storage: Storage | null) {
  memory.clear();
  if (!storage) return true;
  let keys: (string | null)[];
  try {
    keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  } catch {
    return false;
  }
  let cleared = true;
  for (const key of keys)
    if (
      key &&
      (key === 'theme' ||
        (key.startsWith('daysforth.') && key !== CONSENT_KEY) ||
        key.startsWith('cm:'))
    )
      try {
        storage.removeItem(key);
      } catch {
        cleared = false;
      }
  return cleared;
}
