/**
 * Purpose: Exercise the deployed Worker adapter against the production SQL migrations.
 * Scope: Live HTTP delegation with approved/retired keys and scheduled retention cleanup wiring.
 * Does NOT belong: Network access, production data, or mocked SQL consistency.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it, vi } from 'vitest';
import worker from '../../workers/reactions/src/index';
import { reactionDatabase } from './reaction-db';

describe('Cloudflare entry composition', () => {
  it('exposes current and retired reaction keys using the real service', async () => {
    const { db, sqlite } = reactionDatabase();
    try {
      const response = await worker.fetch(new Request('https://api.test/reactions'), { DB: db });
      expect(response.status).toBe(200);
      const counts = await response.json();
      expect(counts).toMatchObject({ born: 0, 'born--celebrate': 0, 'born--laugh': 0 });
      expect(Object.keys(counts)).toContain('born--support');
      expect(counts).toMatchObject({ 'ttsnative-started': 0, 'recalen-started--support': 0 });
      const missing = await worker.fetch(new Request('https://api.test/reactions'), {});
      expect(missing.status).toBe(503);
      expect(missing.headers.get('X-Daysforth-Worker-Version')).toBe('unavailable');
    } finally {
      sqlite.close();
    }
  });
  it('identifies only a valid public deployment UUID from the platform metadata binding', async () => {
    const version = '12345678-1234-4234-8234-123456789abc';
    const identified = await worker.fetch(new Request('https://api.test/health'), {
      CF_VERSION_METADATA: { id: version },
    });
    expect(identified.headers.get('X-Daysforth-Worker-Version')).toBe(version);
    const invalid = await worker.fetch(new Request('https://api.test/health'), {
      CF_VERSION_METADATA: { id: 'untrusted configuration\nwith a newline' },
    });
    expect(invalid.headers.get('X-Daysforth-Worker-Version')).toBe('unavailable');
  });
  it('runs retention cleanup at the platform clock without reducing aggregate totals', async () => {
    const { db, sqlite } = reactionDatabase();
    const now = Date.UTC(2026, 10, 5);
    vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      sqlite.prepare('INSERT INTO reactions VALUES (?, ?, ?)').run('born', 'old-test-hash', 1);
      sqlite.prepare('INSERT INTO reaction_limits VALUES (?, ?, ?)').run('old-bucket', 1, 1);
      await worker.scheduled({}, { DB: db });
      expect(sqlite.prepare('SELECT count(*) AS count FROM reactions').get()!['count']).toBe(0);
      expect(sqlite.prepare('SELECT count(*) AS count FROM reaction_limits').get()!['count']).toBe(
        0,
      );
      expect(
        sqlite.prepare('SELECT count FROM reaction_totals WHERE post_id = ?').get('born')!['count'],
      ).toBe(1);
    } finally {
      vi.restoreAllMocks();
      sqlite.close();
    }
  });
});
