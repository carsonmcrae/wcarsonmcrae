/**
 * Purpose: Run version, release-note, and architecture maintenance checks locally and in CI.
 * Scope: Read manifests and optional Git comparison/tag context, then report policy violations.
 * Does NOT belong: Policy rules (scripts/lib/release-policy.ts), tagging, or deployment.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { currentVersion, releases } from '../src/data/releases.ts';
import { checkReleasePolicy } from './lib/release-policy.ts';

const root = new URL('../', import.meta.url);
const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));
const base = process.env['RELEASE_BASE_SHA'];
const tag = process.env['RELEASE_TAG'] || undefined;
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
// The initial public release can retain the pre-release package version.
const establishedBase = base && git('ls-tree', '--name-only', base, 'src/data/releases.ts');
const changes = base
  ? git('diff', '--name-status', '--no-renames', base, '--')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [status, path] = line.split('\t');
        return { status: status!, path: path! };
      })
      .concat(
        git('ls-files', '--others', '--exclude-standard')
          .split('\n')
          .filter(Boolean)
          .map((path) => ({ status: 'A', path })),
      )
  : [];
const errors = checkReleasePolicy({
  version: currentVersion,
  lockVersion: lock.version,
  lockPackageVersion: lock.packages[''].version,
  releases,
  changes,
  ...(establishedBase
    ? { baseVersion: JSON.parse(git('show', `${base}:package.json`)).version }
    : {}),
  ...(tag ? { tag } : {}),
});
for (const error of errors) console.error(`fail  ${error}`);
if (errors.length) process.exitCode = 1;
else
  console.info(
    `Release ${currentVersion}: manifests, public notes, and supplied change context agree.`,
  );
if (!base)
  console.info(
    'No RELEASE_BASE_SHA supplied; version-bump and architecture-diff checks need comparison context.',
  );
