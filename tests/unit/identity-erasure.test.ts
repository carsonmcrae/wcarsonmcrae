/**
 * Purpose: Protect the database and request budget of the public identity-erasure endpoint.
 * Scope: Indexed lookup, independent network/hour quotas, idempotency, and permanent aggregate safety.
 * Does NOT belong: Production deployment or browser preference controls.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { createHash, randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupReactionLimits,
  handleReactions,
  type ReactionEnvironment,
} from '../../src/lib/reaction-service';
import { erasureRequest } from '../support/reaction-requests';
import { reactionDatabase } from './reaction-db';

const now = 1_800_000_000_000;
const ids = ['born'];
let database: ReturnType<typeof reactionDatabase>;
let environment: ReactionEnvironment;
beforeEach(() => {
  database = reactionDatabase();
  environment = {
    DB: database.db,
    RATE_LIMIT_SALT: 'test-only-erasure-salt-at-least-32-characters',
  };
});
afterEach(() => {
  database.sqlite.close();
  vi.restoreAllMocks();
});

async function react(visitorId: string, time = now) {
  const request = new Request('https://reactions.example.com/reactions/born', {
    method: 'POST',
    headers: erasureRequest(visitorId).headers,
    body: JSON.stringify({ visitorId }),
  });
  return handleReactions(request, environment, ids, time);
}
const erase = (visitorId: string, time = now, network = '192.0.2.1') =>
  handleReactions(erasureRequest(visitorId, network), environment, ids, time);

describe('bounded identity erasure', () => {
  it('preserves the existing reaction bucket namespace during the limiter update', async () => {
    const hour = Math.floor(now / 3_600_000);
    const legacyBucket = createHash('sha256')
      .update(`${environment.RATE_LIMIT_SALT!}:192.0.2.1:${hour}`)
      .digest('hex');
    database.sqlite
      .prepare('INSERT INTO reaction_limits (bucket, hits, expires) VALUES (?, 20, ?)')
      .run(legacyBucket, (hour + 1) * 3_600_000);
    expect((await react(randomUUID())).status).toBe(429);
    expect((await erase(randomUUID())).status).toBe(200);
  });

  it('uses an indexed visitor lookup instead of scanning all reaction records', () => {
    const plan = database.sqlite
      .prepare('EXPLAIN QUERY PLAN DELETE FROM reactions WHERE visitor_hash = ?')
      .all('test-only-hash');
    expect(plan.map((row) => row['detail']).join(' ')).toMatch(
      /SEARCH reactions USING INDEX reactions_visitor_hash/,
    );
    expect(plan.map((row) => row['detail']).join(' ')).not.toContain('SCAN reactions');
  });

  it('allows twenty idempotent erasures and rejects the twenty-first before touching votes', async () => {
    const visitor = randomUUID();
    expect((await react(visitor)).status).toBe(200);
    for (let index = 0; index < 20; index++) {
      const response = await erase(visitor);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ forgotten: true });
    }
    const remaining = randomUUID();
    expect((await react(remaining)).status).toBe(200);
    const blocked = await erase(remaining);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('3600');
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(1);
    expect(
      database.sqlite.prepare('SELECT count FROM reaction_totals WHERE post_id = ?').get('born'),
    ).toMatchObject({ count: 2 });
  });

  it('keeps reaction and erasure allowances independent and resets by network and hour', async () => {
    const first = randomUUID();
    expect((await react(first)).status).toBe(200);
    for (let index = 1; index < 20; index++) expect((await react(randomUUID())).status).toBe(200);
    expect((await react(randomUUID())).status).toBe(429);
    for (let index = 0; index < 20; index++) expect((await erase(first)).status).toBe(200);
    expect((await erase(first)).status).toBe(429);
    expect((await erase(first, now, '192.0.2.2')).status).toBe(200);
    expect((await erase(first, now + 3_600_000)).status).toBe(200);
    expect((await react(randomUUID(), now + 3_600_000)).status).toBe(200);
    await cleanupReactionLimits(database.db, now + 91 * 86400000);
    expect(database.sqlite.prepare('SELECT * FROM reaction_limits').all()).toHaveLength(0);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
    expect(
      database.sqlite.prepare('SELECT count FROM reaction_totals WHERE post_id = ?').get('born'),
    ).toMatchObject({ count: 21 });
  });

  it('documents a late accepted POST after DELETE without claiming atomic erasure', async () => {
    const inserted = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const prepare = database.db.prepare.bind(database.db);
    vi.spyOn(database.db, 'prepare').mockImplementation((sql) => {
      const statement = prepare(sql);
      if (!sql.startsWith('INSERT OR IGNORE INTO reactions')) return statement;
      return {
        ...statement,
        async run() {
          inserted.resolve();
          await release.promise;
          return statement.run();
        },
      };
    });
    const visitor = randomUUID();
    const post = react(visitor);
    await inserted.promise;
    expect(await (await erase(visitor)).json()).toEqual({ forgotten: true });
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
    release.resolve();
    expect((await post).status).toBe(200);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(1);
    await cleanupReactionLimits(database.db, now + 91 * 86400000);
    expect(database.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(0);
    expect(database.sqlite.prepare('SELECT count FROM reaction_totals').get()).toMatchObject({
      count: 1,
    });
  });
});
