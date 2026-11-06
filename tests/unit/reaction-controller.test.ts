/**
 * Purpose: Exercise shared reaction operations independently of post and photo presentation.
 * Scope: Consent boundaries, remembered identities, concurrent votes, validated counts, and honest failures.
 * Does NOT belong: DOM button styling, SQL enforcement, or production network requests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReactionController } from '../../src/lib/reaction-controller';
import { clearPreferences, recordConsent } from '../../src/lib/consent';
import { consentingStorage, memoryStorage } from './helpers';

const identity = '12345678-1234-4234-8234-123456789abc';
function setup(storage = consentingStorage(), endpoint = 'https://api.test') {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ count: 1 }));
  const randomUUID = vi.fn(() => identity as `${string}-${string}-${string}-${string}-${string}`);
  const controller = createReactionController(
    { localStorage: storage, crypto: { randomUUID }, fetch: fetcher },
    endpoint,
  );
  return { controller, storage, fetcher, randomUUID };
}
afterEach(() => {
  clearPreferences(null);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('shared reaction controller', () => {
  it('loads validated public totals and propagates an outage to its presentation adapter', async () => {
    const { controller, fetcher } = setup();
    fetcher.mockResolvedValueOnce(Response.json({ born: 7, 'photo-margot-1': 3 }));
    expect(await controller.load()).toEqual({ born: 7, 'photo-margot-1': 3 });
    expect(fetcher).toHaveBeenCalledWith('https://api.test/reactions', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
    fetcher.mockResolvedValueOnce(Response.json({ 'photo-margot-1': -1 }));
    await expect(controller.load()).rejects.toThrow('Invalid reaction counts');
  });

  it('shares remembered identity and independent choices between moment and photo controllers', async () => {
    const f = setup(consentingStorage({ 'daysforth.visitor': identity }));
    expect(f.controller.hasReacted('photo-margot-1', 'heart')).toBe(false);
    expect(await f.controller.react('photo-margot-1', 'heart')).toEqual({
      status: 'added',
      key: 'photo-margot-1',
      count: 1,
    });
    const second = setup(f.storage);
    expect(second.controller.hasReacted('photo-margot-1', 'heart')).toBe(true);
    expect(await second.controller.react('photo-margot-1', 'heart')).toEqual({
      status: 'duplicate',
    });
    expect(second.fetcher).not.toHaveBeenCalled();
    expect(await second.controller.react('margot-arrives', 'heart')).toMatchObject({
      status: 'added',
    });
    expect(await second.controller.react('photo-margot-1', 'support')).toEqual({
      status: 'added',
      key: 'photo-margot-1--support',
      count: 1,
    });
    expect(second.randomUUID).not.toHaveBeenCalled();
    expect(second.fetcher).toHaveBeenLastCalledWith(
      'https://api.test/reactions/photo-margot-1--support',
      expect.objectContaining({ body: JSON.stringify({ visitorId: identity }) }),
    );
  });

  it('keeps votes in memory until permission and migrates the same identity on consent', async () => {
    const raw = memoryStorage();
    const f = setup(raw);
    raw.setItem('daysforth.visitor', 'invalid-and-not-consented');
    expect(await f.controller.react('photo-quinn-1', 'laugh')).toMatchObject({ status: 'added' });
    expect(raw.getItem('daysforth.visitor')).toBe('invalid-and-not-consented');
    expect(raw.getItem('daysforth.reacted.photo-quinn-1--laugh')).toBeNull();
    expect(f.controller.hasReacted('photo-quinn-1', 'laugh')).toBe(true);
    expect(f.randomUUID).toHaveBeenCalledTimes(1);
    recordConsent(raw, true);
    expect(raw.getItem('daysforth.visitor')).toBe(identity);
    expect(raw.getItem('daysforth.reacted.photo-quinn-1--laugh')).toBe('true');
    clearPreferences(raw);
    recordConsent(raw, false);
    expect(f.controller.hasReacted('photo-quinn-1', 'laugh')).toBe(false);
  });

  it('replaces invalid identities and permits retry after a failed request', async () => {
    const f = setup(consentingStorage({ 'daysforth.visitor': 'malformed' }));
    f.fetcher.mockRejectedValueOnce(new Error('offline'));
    expect(await f.controller.react('photo-carson-solo', 'celebrate')).toEqual({
      status: 'failed',
    });
    expect(f.controller.hasReacted('photo-carson-solo', 'celebrate')).toBe(false);
    expect(await f.controller.react('photo-carson-solo', 'celebrate')).toMatchObject({
      status: 'added',
    });
    expect(f.randomUUID).toHaveBeenCalledTimes(1);
    expect(f.storage.getItem('daysforth.visitor')).toBe(identity);
  });
  it('releases a stalled vote at its deadline so another deliberate activation can retry', async () => {
    vi.useFakeTimers();
    const f = setup();
    f.fetcher.mockReturnValueOnce(new Promise(() => {}));
    const pending = f.controller.react('born', 'heart');
    expect(await f.controller.react('born', 'heart')).toEqual({ status: 'duplicate' });
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toEqual({ status: 'failed' });
    expect(f.controller.hasReacted('born', 'heart')).toBe(false);
    expect(await f.controller.react('born', 'heart')).toMatchObject({ status: 'added' });
    expect(f.randomUUID).toHaveBeenCalledTimes(1);
  });

  it('does not submit without an endpoint or writable identity storage', async () => {
    const off = setup(consentingStorage(), '');
    expect(await off.controller.react('born', 'heart')).toEqual({ status: 'unavailable' });
    expect(off.randomUUID).not.toHaveBeenCalled();
    expect(off.fetcher).not.toHaveBeenCalled();
    const blocked = setup();
    vi.spyOn(blocked.storage, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(await blocked.controller.react('born', 'heart')).toEqual({ status: 'storage' });
    expect(blocked.fetcher).not.toHaveBeenCalled();
    expect(blocked.controller.hasReacted('born', 'heart')).toBe(false);
  });

  it('reports identity creation failures without sending a vote or stranding an in-flight key', async () => {
    const f = setup();
    f.randomUUID.mockImplementationOnce(() => {
      throw new Error('identity unavailable');
    });
    expect(await f.controller.react('photo-margot-1', 'heart')).toEqual({ status: 'failed' });
    expect(f.fetcher).not.toHaveBeenCalled();
    expect(await f.controller.react('photo-margot-1', 'heart')).toMatchObject({ status: 'added' });
  });

  it('remembers a server-confirmed choice when its optional persisted flag fails, until forgotten', async () => {
    const f = setup();
    const write = f.storage.setItem.bind(f.storage);
    vi.spyOn(f.storage, 'setItem').mockImplementation((key, value) => {
      if (key.startsWith('daysforth.reacted.')) throw new Error('choice storage full');
      write(key, value);
    });
    expect(await f.controller.react('photo-margot-1', 'heart')).toMatchObject({ status: 'added' });
    expect(f.storage.getItem('daysforth.reacted.photo-margot-1')).toBeNull();
    expect(f.controller.hasReacted('photo-margot-1', 'heart')).toBe(true);
    expect(await f.controller.react('photo-margot-1', 'heart')).toEqual({ status: 'duplicate' });
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    clearPreferences(f.storage);
    recordConsent(f.storage, false);
    expect(f.controller.hasReacted('photo-margot-1', 'heart')).toBe(false);
  });

  it('does not restore a forgotten choice when an earlier in-flight vote finishes', async () => {
    const f = setup();
    let finish!: (response: Response) => void;
    f.fetcher.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const pending = f.controller.react('photo-margot-1', 'heart');
    clearPreferences(f.storage);
    finish(Response.json({ count: 5 }));
    expect(await pending).toEqual({ status: 'added', key: 'photo-margot-1', count: 5 });
    expect(f.storage.getItem('daysforth.visitor')).toBeNull();
    expect(f.storage.getItem('daysforth.reacted.photo-margot-1')).toBeNull();
    expect(f.controller.hasReacted('photo-margot-1', 'heart')).toBe(false);
  });

  it('prevents concurrent same-key requests while allowing another reaction kind', async () => {
    const f = setup();
    let finish!: (response: Response) => void;
    f.fetcher.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const first = f.controller.react('photo-margot-1', 'heart');
    expect(await f.controller.react('photo-margot-1', 'heart')).toEqual({ status: 'duplicate' });
    expect(await f.controller.react('photo-margot-1', 'celebrate')).toMatchObject({
      status: 'added',
    });
    expect(f.fetcher).toHaveBeenCalledTimes(2);
    finish(Response.json({ count: 4 }));
    expect(await first).toEqual({ status: 'added', key: 'photo-margot-1', count: 4 });
    expect(f.controller.hasReacted('photo-margot-1', 'heart')).toBe(true);
  });
});
