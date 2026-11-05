/**
 * Purpose: Contract tests for the browser reaction client.
 * Scope: Endpoint validation, real nonnegative totals, safe URLs, and server/malformed failures.
 * Does NOT belong: SQL consistency or DOM actions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it, vi } from 'vitest';
import {
  loadReactionCounts,
  reactionEndpoint,
  reactionOrigin,
  submitReaction,
} from '../../src/lib/reaction-api';

describe('reaction endpoint', () => {
  it('supports an unset endpoint, HTTPS, and loopback development', () => {
    expect(reactionEndpoint(undefined)).toBe('');
    expect(reactionOrigin(undefined)).toBe('');
    expect(reactionOrigin('https://api.example.com/service/')).toBe('https://api.example.com');
    expect(reactionEndpoint(' ')).toBe('');
    expect(reactionEndpoint('https://reactions.example.com/')).toBe(
      'https://reactions.example.com',
    );
    expect(reactionEndpoint('http://localhost:8787')).toBe('http://localhost:8787');
    expect(reactionEndpoint('http://127.0.0.1:8787')).toBe('http://127.0.0.1:8787');
    expect(() => reactionEndpoint('http://example.com')).toThrow(/HTTPS/);
    expect(() => reactionEndpoint('ftp://localhost')).toThrow(/HTTPS/);
    expect(() => reactionEndpoint('ftp://127.0.0.1')).toThrow(/HTTPS/);
    expect(() => reactionEndpoint('invalid')).toThrow();
  });
  it.each([
    'https://user@api.example.com',
    'https://:password@api.example.com',
    'https://api.example.com?token=private',
    'https://api.example.com#private',
  ])('rejects public endpoint configuration containing private or ambiguous parts: %s', (url) => {
    expect(() => reactionEndpoint(url)).toThrow(/credentials, a query, or a fragment/);
  });
});
describe('count and vote contracts', () => {
  it('loads actual shared totals and submits an encoded, idempotent vote', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ born: 0, wedding: 3 }))
      .mockResolvedValueOnce(Response.json({ count: 4 }));
    expect(await loadReactionCounts('https://api.example.com', fetcher)).toEqual({
      born: 0,
      wedding: 3,
    });
    expect(fetcher).toHaveBeenLastCalledWith('https://api.example.com/reactions', {
      cache: 'no-store',
    });
    expect(await submitReaction('https://api.example.com', 'a/b', 'visitor', fetcher)).toBe(4);
    expect(fetcher).toHaveBeenLastCalledWith(
      'https://api.example.com/reactions/a%2Fb',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ visitorId: 'visitor' }) }),
    );
  });
  it.each(
    [
      null,
      [],
      3,
      { count: -1 },
      { count: 0.1 },
      { count: '1' },
      { count: Number.MAX_SAFE_INTEGER + 1 },
    ].map((value) => [value]),
  )('rejects invalid counts %j', async (counts) => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(counts));
    await expect(loadReactionCounts('https://api.example.com', fetcher)).rejects.toThrow(/Invalid/);
    await expect(
      submitReaction('https://api.example.com', 'born', 'visitor', fetcher),
    ).rejects.toThrow(/Invalid/);
  });
  it('rejects server failures and a vote response missing its count', async () => {
    const bad = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(loadReactionCounts('https://api.example.com', bad)).rejects.toThrow(/unavailable/);
    await expect(submitReaction('https://api.example.com', 'born', 'visitor', bad)).rejects.toThrow(
      /could not/,
    );
    await expect(
      submitReaction(
        'https://api.example.com',
        'born',
        'visitor',
        vi.fn<typeof fetch>().mockResolvedValue(Response.json({})),
      ),
    ).rejects.toThrow(/Invalid/);
  });
});
