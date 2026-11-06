/**
 * Purpose: HTTP and real-SQL guarantees for shared Daysforth reactions.
 * Scope: Global totals, duplicate/concurrent votes, privacy, rate limits, origins, and malformed requests.
 * Does NOT belong: Browser button state or live Cloudflare deployment tests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupReactionLimits,
  handleReactions,
  type ReactionEnvironment,
} from '../../src/lib/reaction-service';
import { reactionDatabase } from './reaction-db';
import { erasureRequest } from '../support/reaction-requests';
const ids = ['born', 'graduation'];
const now = 1_800_000_000_000;
let database: ReturnType<typeof reactionDatabase>;
let env: ReactionEnvironment;
beforeEach(() => {
  database = reactionDatabase();
  env = {
    DB: database.db,
    RATE_LIMIT_SALT: 'test-only-salt-with-at-least-32-characters',
    ALLOWED_ORIGINS: 'https://wcarsonmcrae.com, https://www.wcarsonmcrae.com',
  };
});
afterEach(() => {
  database.sqlite.close();
  vi.restoreAllMocks();
});
function vote(visitorId = randomUUID(), id = 'born', options: RequestInit = {}) {
  return new Request(`https://reactions.example.com/reactions/${id}`, {
    method: 'POST',
    headers: {
      Origin: 'https://wcarsonmcrae.com',
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.1',
    },
    body: JSON.stringify({ visitorId }),
    ...options,
  });
}
const read = (origin?: string) =>
  new Request('https://reactions.example.com/reactions', {
    headers: origin ? { Origin: origin } : {},
  });

describe('shared totals', () => {
  it('keeps all kinds permanent while erasing only a requesting visitor’s identifiers', async () => {
    const kinds = ['born', 'born--celebrate', 'born--laugh', 'born--support'];
    const visitor = randomUUID();
    for (const kind of kinds) await handleReactions(vote(visitor, kind), env, kinds, now);
    await handleReactions(vote(randomUUID(), 'born--celebrate'), env, kinds, now);
    const erase = () => handleReactions(erasureRequest(visitor), env, kinds, now);
    expect(await (await erase()).json()).toEqual({ forgotten: true });
    expect(await (await erase()).json()).toEqual({ forgotten: true });
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(1);
    expect(await (await handleReactions(read(), env, kinds, now)).json()).toEqual({
      born: 1,
      'born--celebrate': 2,
      'born--laugh': 1,
      'born--support': 1,
    });
  });
  it('returns zeros only from the live database and exposes only approved moments', async () => {
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 0,
      graduation: 0,
    });
    database.sqlite.exec("INSERT INTO reaction_totals VALUES ('retired-post', 8)");
    const response = await handleReactions(read('https://wcarsonmcrae.com'), env, ids, now);
    expect(await response.json()).toEqual({ born: 0, graduation: 0 });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://wcarsonmcrae.com');
    expect(response.headers.get('Cache-Control')).toContain('max-age=15');
  });
  it('counts different browsers globally but the same browser only once per moment', async () => {
    const visitor = randomUUID();
    expect(await (await handleReactions(vote(visitor), env, ids, now)).json()).toEqual({
      count: 1,
    });
    expect(await (await handleReactions(vote(visitor), env, ids, now)).json()).toEqual({
      count: 1,
    });
    expect(await (await handleReactions(vote(), env, ids, now)).json()).toEqual({ count: 2 });
    expect(
      await (await handleReactions(vote(visitor, 'graduation'), env, ids, now)).json(),
    ).toEqual({ count: 1 });
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 2,
      graduation: 1,
    });
  });
  it('keeps simultaneous duplicate submissions idempotent through SQL uniqueness and the trigger', async () => {
    const visitor = randomUUID();
    const responses = await Promise.all([
      handleReactions(vote(visitor), env, ids, now),
      handleReactions(vote(visitor), env, ids, now),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 1,
      graduation: 0,
    });
  });
  it('never stores raw network addresses or visitor IDs', async () => {
    const visitor = randomUUID();
    await handleReactions(vote(visitor), env, ids, now);
    const stored = JSON.stringify({
      votes: database.sqlite.prepare('SELECT * FROM reactions').all(),
      limits: database.sqlite.prepare('SELECT * FROM reaction_limits').all(),
    });
    expect(stored).not.toContain(visitor);
    expect(stored).not.toContain('192.0.2.1');
    expect(stored).toMatch(/[a-f\d]{64}/);
  });
  it('retains aggregate totals when deduplication identifiers are removed', async () => {
    await handleReactions(vote(), env, ids, now);
    await handleReactions(vote(), env, ids, now);
    database.sqlite.exec(
      'DELETE FROM reactions WHERE rowid = (SELECT rowid FROM reactions LIMIT 1)',
    );
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 2,
      graduation: 0,
    });
    database.sqlite.exec('DELETE FROM reactions');
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 2,
      graduation: 0,
    });
  });
});
describe('abuse limits and resilience', () => {
  it('expires identifiers after 90 days without reducing permanent totals', async () => {
    await handleReactions(vote(), env, ids, now - 91 * 86400000);
    await handleReactions(vote(), env, ids, now);
    await cleanupReactionLimits(database.db, now);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(1);
    expect(await (await handleReactions(read(), env, ids, now)).json()).toEqual({
      born: 2,
      graduation: 0,
    });
  });
  it('limits new reactions by network/hour, permits a duplicate, and resets next hour', async () => {
    const first = randomUUID();
    await handleReactions(vote(first), env, ids, now);
    for (let index = 1; index < 20; index++)
      expect((await handleReactions(vote(), env, ids, now)).status).toBe(200);
    const blocked = await handleReactions(vote(), env, ids, now);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('3600');
    expect((await handleReactions(vote(first), env, ids, now)).status).toBe(200);
    expect((await handleReactions(vote(), env, ids, now + 3_600_000)).status).toBe(200);
    await cleanupReactionLimits(database.db, now + 3_600_000);
    expect(database.sqlite.prepare('SELECT * FROM reaction_limits').all()).toHaveLength(1);
  });
  it('supports local development and JSON charset parameters', async () => {
    const response = await handleReactions(
      vote(randomUUID(), 'born', {
        headers: {
          Origin: 'http://localhost:8787',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
      { ...env, ALLOWED_ORIGINS: 'http://localhost:8787' },
      ids,
    );
    expect(response.status).toBe(200);
    expect(
      (
        await handleReactions(
          vote(),
          { DB: database.db, RATE_LIMIT_SALT: env.RATE_LIMIT_SALT! },
          ids,
        )
      ).status,
    ).toBe(200);
  });
  it('returns an honest unavailable state when bindings, salt, SQL, or count integrity fail', async () => {
    expect((await handleReactions(read(), {}, ids, now)).status).toBe(503);
    expect((await handleReactions(vote(), { DB: database.db }, ids, now)).status).toBe(503);
    expect(
      (await handleReactions(vote(), { ...env, RATE_LIMIT_SALT: 'short' }, ids, now)).status,
    ).toBe(503);
    database.sqlite.exec('DROP TRIGGER reaction_added');
    const integrity = await handleReactions(vote(), env, ids, now);
    expect(integrity.status).toBe(503);
    expect(await integrity.json()).toMatchObject({ code: 'REACTIONS_INTEGRITY' });
    vi.spyOn(database.db, 'prepare').mockImplementation(() => {
      throw new Error('offline');
    });
    const response = await handleReactions(read(), env, ids, now);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('offline');
  });
});
describe('HTTP boundary', () => {
  it('handles preflight and rejects unapproved browser origins', async () => {
    const preflight = await handleReactions(
      new Request('https://reactions.example.com/reactions', {
        method: 'OPTIONS',
        headers: { Origin: 'https://wcarsonmcrae.com' },
      }),
      env,
      ids,
      now,
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    const bad = await handleReactions(read('https://unapproved.example.com'), env, ids, now);
    expect(bad.status).toBe(403);
    expect(bad.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(bad.headers.get('Content-Security-Policy')).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
    expect(bad.headers.get('X-Frame-Options')).toBe('DENY');
    expect(bad.headers.get('Referrer-Policy')).toBe('no-referrer');
    const missing = await handleReactions(
      vote(randomUUID(), 'born', { headers: { 'Content-Type': 'application/json' } }),
      env,
      ids,
      now,
    );
    expect(missing.status).toBe(403);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
  });
  it.each([
    ['/wrong', 'GET', 404],
    ['/reactions/nope', 'POST', 404],
    ['/reactions/born', 'GET', 404],
    ['/reactions', 'POST', 404],
    ['/reactions', 'DELETE', 405],
    ['/reactions/born', 'PUT', 405],
    ['/reactions/born', 'DELETE', 405],
    ['/identity', 'GET', 405],
    ['/identity', 'POST', 405],
  ])('rejects %s %s with %s', async (path, method, status) => {
    expect(
      (
        await handleReactions(
          new Request(`https://reactions.example.com${path}`, {
            method,
            headers: { Origin: 'https://wcarsonmcrae.com' },
          }),
          env,
          ids,
          now,
        )
      ).status,
    ).toBe(status);
  });
  it.each([null, 3, {}, [], { visitorId: 2 }, { visitorId: 'bad' }].map((value) => [value]))(
    'rejects invalid identities %j',
    async (payload) => {
      expect(
        (
          await handleReactions(
            vote(randomUUID(), 'born', { body: JSON.stringify(payload) }),
            env,
            ids,
            now,
          )
        ).status,
      ).toBe(400);
    },
  );
  it('rejects missing content types, malformed JSON, missing bodies, and oversized streamed bodies', async () => {
    expect(
      (
        await handleReactions(
          vote(randomUUID(), 'born', { headers: { Origin: 'https://wcarsonmcrae.com' } }),
          env,
          ids,
          now,
        )
      ).status,
    ).toBe(415);
    expect(
      (await handleReactions(vote(randomUUID(), 'born', { body: '{' }), env, ids, now)).status,
    ).toBe(400);
    expect(
      (await handleReactions(vote(randomUUID(), 'born', { body: null }), env, ids, now)).status,
    ).toBe(400);
    expect(
      (await handleReactions(vote(randomUUID(), 'born', { body: 'x'.repeat(513) }), env, ids, now))
        .status,
    ).toBe(400);
    const encoded = new TextEncoder().encode(JSON.stringify({ visitorId: randomUUID() }));
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoded.slice(0, 10));
        controller.enqueue(encoded.slice(10));
        controller.close();
      },
    });
    const streamed = vote(randomUUID(), 'born', { body: stream, duplex: 'half' } as RequestInit);
    expect((await handleReactions(streamed, env, ids, now)).status).toBe(200);
  });
});
