/**
 * Purpose: A real SQLite-backed D1 adapter for reaction-service tests.
 * Scope: Runs the production migration and SQL against an isolated in-memory database.
 * Does NOT belong: Production database code or mocked count/rate-limit logic.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { ReactionDatabase, ReactionStatement } from '../../src/lib/reaction-service';
export function reactionDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const directory = new URL('../../workers/reactions/migrations/', import.meta.url);
  for (const file of readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b)))
    sqlite.exec(readFileSync(new URL(file, directory), 'utf8'));
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
