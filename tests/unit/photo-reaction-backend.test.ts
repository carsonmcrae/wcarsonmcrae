/**
 * Purpose: Prove additive photo reactions preserve published moment totals and service protections.
 * Scope: Production Worker composition and real migrated SQLite, including shared limits and identity erasure.
 * Does NOT belong: Live service writes, invented initial counts, or browser presentation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../../workers/reactions/src/index';
import { reactionDatabase } from './reaction-db';
import { reactionKeys } from '../../src/lib/reaction-keys';
import { erasureRequest } from '../support/reaction-requests';
import type { ReactionEnvironment } from '../../src/lib/reaction-service';

let database: ReturnType<typeof reactionDatabase>;
let env: ReactionEnvironment;
beforeEach(() => {
  database = reactionDatabase();
  env = {
    DB: database.db,
    RATE_LIMIT_SALT: 'test-only-salt-with-at-least-32-characters',
  };
});
afterEach(() => {
  database.sqlite.close();
  vi.restoreAllMocks();
});
const totals = async () => {
  const response = await worker.fetch(new Request('https://api.test/reactions'), env);
  expect(response.status).toBe(200);
  return response.json() as Promise<Record<string, number>>;
};
function vote(id: string, visitorId = randomUUID(), origin = 'https://wcarsonmcrae.com') {
  return new Request(`https://api.test/reactions/${id}`, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.1',
    },
    body: JSON.stringify({ visitorId }),
  });
}

describe('additive photo reaction deployment', () => {
  it('keeps preexisting permanent moment and alias totals while exposing independent photo kinds', async () => {
    database.sqlite.exec(
      "INSERT INTO reaction_totals VALUES ('born', 7), ('born--support', 2), ('ttsnative-started', 3)",
    );
    const before = await totals();
    expect(before).toMatchObject({ born: 7, 'born--support': 2, 'ttsnative-started': 3 });
    const visitor = randomUUID();
    for (const key of reactionKeys(['photo-margot-1', 'screen-daysforth-interface'])) {
      expect(before[key]).toBe(0);
      expect(await (await worker.fetch(vote(key, visitor), env)).json()).toEqual({ count: 1 });
      expect(await (await worker.fetch(vote(key, visitor), env)).json()).toEqual({ count: 1 });
    }
    const after = await totals();
    expect(after).toMatchObject({ born: 7, 'born--support': 2, 'ttsnative-started': 3 });
    for (const key of reactionKeys(['photo-margot-1', 'screen-daysforth-interface']))
      expect(after[key]).toBe(1);
    expect(after['photo-me-my-family']).toBe(0);
    expect(after['photo-me-nicoles-family']).toBe(0);
    expect(await (await worker.fetch(erasureRequest(visitor), env)).json()).toEqual({
      forgotten: true,
    });
    expect(await totals()).toEqual(after);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
  });

  it('shares the existing vote allowance across photos and posts without charging duplicate votes', async () => {
    const first = randomUUID();
    expect((await worker.fetch(vote('born', first), env)).status).toBe(200);
    for (let index = 1; index < 20; index++) {
      const key = index % 2 === 0 ? 'born' : 'photo-quinn-1';
      expect((await worker.fetch(vote(key), env)).status).toBe(200);
    }
    const limited = await worker.fetch(vote('photo-quinn-1--support'), env);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('3600');
    expect((await worker.fetch(vote('born', first), env)).status).toBe(200);
    const counts = await totals();
    expect(counts).toMatchObject({ born: 10, 'photo-quinn-1': 10, 'photo-quinn-1--support': 0 });
    expect((await worker.fetch(erasureRequest(first), env)).status).toBe(200);
    expect(await totals()).toEqual(counts);
  });

  it('rejects unapproved assets and origins without storing votes or exposing arbitrary assets as targets', async () => {
    expect((await worker.fetch(vote('photo-unapproved-upload'), env)).status).toBe(404);
    expect((await worker.fetch(vote('photo-carson-headshot'), env)).status).toBe(404);
    const denied = await worker.fetch(
      vote('photo-margot-1', randomUUID(), 'https://other.test'),
      env,
    );
    expect(denied.status).toBe(403);
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
    const publicRead = await worker.fetch(new Request('https://api.test/reactions'), env);
    expect(publicRead.headers.get('set-cookie')).toBeNull();
    expect(publicRead.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('cleans photo deduplication hashes on the same retention schedule without reducing photo totals', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 5));
    database.sqlite
      .prepare('INSERT INTO reactions VALUES (?, ?, ?)')
      .run('photo-margot-1', 'old-hash', 1);
    await worker.scheduled({}, env);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
    expect((await totals())['photo-margot-1']).toBe(1);
  });
});
