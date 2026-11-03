/**
 * Purpose: Lists the repository's first-party files for the repository gates.
 * Scope: Asks git for tracked files plus untracked files that are not ignored, so new work is
 *   checked before it is committed, and returns sorted, repository-relative paths.
 * Does NOT belong: Deciding which files a gate checks (each gate's own module) or reading contents.
 */
import { execFileSync } from 'node:child_process';

export type GitRunner = (root: string) => string;

export const gitListFiles: GitRunner = (root) =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  });

export const byCodeUnit = (a: string, b: string) => Number(a > b) - Number(a < b);

export function parseFileList(output: string): string[] {
  return [...new Set(output.split('\0').filter(Boolean))].sort(byCodeUnit);
}

export function listRepoFiles(root: string, run: GitRunner = gitListFiles): string[] {
  return parseFileList(run(root));
}
