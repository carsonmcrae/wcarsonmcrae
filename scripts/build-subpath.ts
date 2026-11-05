/**
 * Purpose: Command-line entry that proves the site works under a GitHub Pages project path
 *   (npm run test:build:subpath).
 * Scope: Builds into dist-subpath/ as https://carsonmcrae.github.io/wcarsonmcrae/ and runs the
 *   built-site checks against that output, so links and assets cannot assume the domain root.
 * Does NOT belong: The checks themselves (tests/build) or deployment (.github/workflows/deploy.yml).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  SITE_URL: 'https://carsonmcrae.github.io',
  BASE_PATH: '/wcarsonmcrae',
  DIST_DIR: 'dist-subpath',
};
const shell = process.platform === 'win32';

for (const args of [
  ['exec', '--', 'astro', 'build', '--outDir', 'dist-subpath'],
  ['exec', '--', 'vitest', 'run', '--config', 'vitest.build.config.ts'],
]) {
  const result = spawnSync('npm', args, { env, stdio: 'inherit', shell });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
