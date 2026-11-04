/**
 * Purpose: A real SQLite-backed D1 adapter for reaction-service tests.
 * Scope: Runs the production migration and SQL against an isolated in-memory database.
 * Does NOT belong: Production database code or mocked count/rate-limit logic.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { ReactionDatabase, ReactionStatement } from '../../src/lib/reaction-service';
export function reactionDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(
    readFileSync(
      new URL('../../workers/reactions/migrations/0001_reactions.sql', import.meta.url),
      'utf8',
    ),
  );
  const db: ReactionDatabase = {
    prepare(sql): ReactionStatement {
      let values: (string | number)[] = [];
      return {
        bind(...bindings) {
          values = bindings;
          return this;
        },
        async first<T>() {
          return (sqlite.prepare(sql).get(...values) as T | undefined) ?? null;
        },
        async all<T>() {
          return { results: sqlite.prepare(sql).all(...values) as T[] };
        },
        async run() {
          return sqlite.prepare(sql).run(...values);
        },
      };
    },
  };
  return { db, sqlite };
}
