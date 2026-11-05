/**
 * Purpose: Shared fakes for the unit tests.
 * Scope: Controllable matchMedia results, in-memory storage, and storage that throws like a
 *   blocked browser.
 * Does NOT belong: Assertions or test cases (the *.test.ts files beside it).
 */
import { vi } from 'vitest';
import { CONSENT_KEY } from '../../src/lib/consent';
export function consentingStorage(initial: Record<string, string> = {}) {
  return memoryStorage({
    [CONSENT_KEY]: JSON.stringify({ allowed: true, expires: Number.MAX_SAFE_INTEGER }),
    ...initial,
  });
}

export interface FakeMediaQuery {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  /** Simulates the operating system or viewport changing. */
  change(matches: boolean): void;
}

export function fakeMediaQuery(matches: boolean, media = ''): FakeMediaQuery {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query: FakeMediaQuery = {
    matches,
    media,
    addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    change(next: boolean) {
      query.matches = next;
      for (const listener of listeners) {
        listener({ matches: next, media } as MediaQueryListEvent);
      }
    },
  };
  return query;
}

export function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, String(value)),
  };
}

export function throwingStorage(): Storage {
  const fail = () => {
    throw new Error('Storage is disabled');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}
