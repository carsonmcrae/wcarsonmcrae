/**
 * Purpose: Safe access to localStorage.
 * Scope: Returns localStorage when the browser allows it, and reads and writes items without
 *   throwing in private browsing or when storage is blocked.
 * Does NOT belong: Deciding what is stored (src/lib/theme.ts and src/lib/achievements.ts).
 */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Returns `localStorage` when the browser allows it. Private browsing modes
 * and blocked storage can throw on access, so callers always get either a
 * usable store or `null`.
 */
export function safeStorage(win: Pick<Window, 'localStorage'>): StorageLike | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

export function readItem(storage: StorageLike | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(storage: StorageLike | null, key: string, value: string): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
