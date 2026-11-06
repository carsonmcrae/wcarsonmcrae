/**
 * Purpose: Verify safe operational health and failure attribution for the reaction service.
 * Scope: Real schema probes, release identity, bounded public output, and classified unavailable states.
 * Does NOT belong: Production monitoring, private configuration, or synthetic live votes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleReactions, type ReactionEnvironment } from '../../src/lib/reaction-service';
import { releaseVersion } from '../../src/lib/release-identity';
import { reactionDatabase } from './reaction-db';

let database: ReturnType<typeof reactionDatabase>;
let env: ReactionEnvironment;
beforeEach(() => {
  database = reactionDatabase();
  env = { DB: database.db, RATE_LIMIT_SALT: 'test-only-health-salt-at-least-32-characters' };
});
afterEach(() => {
  database.sqlite.close();
  vi.restoreAllMocks();
});
const health = (environment = env, method = 'GET') =>
  handleReactions(new Request('https://api.test/health', { method }), environment, ['born']);

describe('reaction operational health', () => {
  it('probes the actual schema and read contract without writes or exposing stored values', async () => {
    database.sqlite
      .prepare('INSERT INTO reactions VALUES (?, ?, ?)')
      .run('born', 'private-hash', 1);
    const before = database.sqlite.prepare('SELECT total_changes() AS total').get();
    const response = await health();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', release: releaseVersion });
    expect(response.headers.get('X-Daysforth-Release')).toBe(releaseVersion);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(database.sqlite.prepare('SELECT total_changes() AS total').get()).toEqual(before);
    const counts = await handleReactions(new Request('https://api.test/reactions'), env, ['born']);
    expect(counts.headers.get('X-Daysforth-Release')).toBe(releaseVersion);
    expect(await counts.json()).toEqual({ born: 1 });
  });

  it.each([undefined, 'short'])('fails health for unavailable configuration (%s)', async (salt) => {
    const environment: ReactionEnvironment = { DB: database.db };
    if (salt) environment.RATE_LIMIT_SALT = salt;
    const response = await health(environment);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'REACTIONS_CONFIGURATION' });
  });

  it('fails when a required migration object is absent', async () => {
    database.sqlite.exec('DROP INDEX reactions_visitor_hash');
    const response = await health();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'REACTIONS_SCHEMA' });
  });

  it('fails when the old decrement trigger would violate permanent totals', async () => {
    database.sqlite.exec(
      'CREATE TRIGGER reaction_removed AFTER DELETE ON reactions BEGIN SELECT 1; END;',
    );
    expect(await (await health()).json()).toMatchObject({ code: 'REACTIONS_SCHEMA' });
  });

  it('fails a missing schema result and sanitizes database exceptions', async () => {
    const prepare = database.db.prepare.bind(database.db);
    vi.spyOn(database.db, 'prepare').mockImplementationOnce((sql) => ({
      ...prepare(sql),
      first: async () => null,
    }));
    expect(await (await health()).json()).toMatchObject({ code: 'REACTIONS_SCHEMA' });
    vi.spyOn(database.db, 'prepare').mockImplementation(() => {
      throw new Error('database credentials and private row details');
    });
    const response = await health();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Reactions are unavailable',
      code: 'REACTIONS_STORAGE',
    });
  });

  it.each(['POST', 'DELETE'])('rejects health writes (%s)', async (method) => {
    expect((await health(env, method)).status).toBe(405);
  });
});
