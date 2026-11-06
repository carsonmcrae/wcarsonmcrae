/**
 * Purpose: Rehearse aggregate-preserving recovery with isolated synthetic reaction databases.
 * Scope: Historical rows, permanent totals, trigger ordering, and a new post-recovery vote.
 * Does NOT belong: Provider backup-format claims or any production restore operation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { randomUUID } from 'node:crypto';
import type { SQLOutputValue } from 'node:sqlite';
import { expect, it } from 'vitest';
import { handleReactions } from '../../src/lib/reaction-service';
import { erasureRequest } from '../support/reaction-requests';
import { reactionDatabase } from './reaction-db';

interface ReactionRow extends Record<string, SQLOutputValue> {
  post_id: string;
  visitor_hash: string;
  created_at: number;
}
interface TotalRow extends Record<string, SQLOutputValue> {
  post_id: string;
  count: number;
}
interface LimitRow extends Record<string, SQLOutputValue> {
  bucket: string;
  hits: number;
  expires: number;
}

it('restores permanent totals exactly without replaying the increment trigger for historical identifiers', async () => {
  const source = reactionDatabase();
  const target = reactionDatabase();
  try {
    source.sqlite.exec(
      "INSERT INTO reactions VALUES ('born', 'retained', 1), ('born', 'erased', 1); " +
        "DELETE FROM reactions WHERE visitor_hash = 'erased'; " +
        "INSERT INTO reaction_totals VALUES ('retired-image', 8); " +
        "INSERT INTO reaction_limits VALUES ('fixture-bucket', 2, 9999999999999)",
    );
    const totals = source.sqlite
      .prepare('SELECT post_id, count FROM reaction_totals ORDER BY post_id')
      .all() as TotalRow[];
    const reactions = source.sqlite
      .prepare('SELECT post_id, visitor_hash, created_at FROM reactions')
      .all() as ReactionRow[];
    const limits = source.sqlite
      .prepare('SELECT bucket, hits, expires FROM reaction_limits')
      .all() as LimitRow[];
    const trigger = source.sqlite
      .prepare("SELECT sql FROM sqlite_master WHERE name = 'reaction_added'")
      .get()!['sql'] as string;
    target.sqlite.exec('BEGIN; DROP TRIGGER reaction_added');
    for (const row of reactions)
      target.sqlite
        .prepare('INSERT INTO reactions VALUES (?, ?, ?)')
        .run(row.post_id, row.visitor_hash, row.created_at);
    for (const row of totals)
      target.sqlite
        .prepare('INSERT INTO reaction_totals VALUES (?, ?)')
        .run(row.post_id, row.count);
    for (const row of limits)
      target.sqlite
        .prepare('INSERT INTO reaction_limits VALUES (?, ?, ?)')
        .run(row.bucket, row.hits, row.expires);
    target.sqlite.exec(trigger);
    target.sqlite.exec('COMMIT');
    expect(target.sqlite.prepare('SELECT * FROM reaction_totals ORDER BY post_id').all()).toEqual(
      totals,
    );
    expect(target.sqlite.prepare('SELECT * FROM reactions').all()).toHaveLength(1);
    expect(target.sqlite.prepare('SELECT * FROM reaction_limits').all()).toEqual([
      { bucket: 'fixture-bucket', hits: 2, expires: 9999999999999 },
    ]);
    const visitor = randomUUID();
    const template = erasureRequest(visitor);
    const request = new Request('https://api.test/reactions/born', {
      method: 'POST',
      headers: template.headers,
      body: JSON.stringify({ visitorId: visitor }),
    });
    const response = await handleReactions(
      request,
      { DB: target.db, RATE_LIMIT_SALT: 'test-only-recovery-salt-at-least-32-characters' },
      ['born', 'retired-image'],
    );
    expect(await response.json()).toEqual({ count: 3 });
    expect(
      target.sqlite
        .prepare('SELECT count FROM reaction_totals WHERE post_id = ?')
        .get('retired-image'),
    ).toMatchObject({ count: 8 });
  } finally {
    source.sqlite.close();
    target.sqlite.close();
  }
});
