/**
 * Purpose: Lists every file under a directory, for tests that inspect source or build output.
 * Scope: A recursive, synchronous walk returning absolute paths.
 * Does NOT belong: Filtering or reading files (the calling test).
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
