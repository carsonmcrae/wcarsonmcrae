/**
 * Purpose: Vitest configuration for the unit tests under tests/unit.
 * Scope: The test file pattern, hang guards, and the V8 coverage contract: 100% statements,
 *   branches, functions, and lines for every executable source file, checked per file.
 * Constraints: Never lower a threshold or exclude a file to pass; extract and test the logic.
 * Does NOT belong: Checks against the built site (vitest.build.config.ts) or browser tests
 *   (playwright.config.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      // Include adapters and configuration as well as logic; composition tests cover their seams.
      include: [
        'src/lib/**/*.ts',
        'src/data/**/*.ts',
        'src/scripts/**/*.ts',
        'src/pages/*.ts',
        'scripts/**/*.ts',
        'scripts/*.mjs',
        'workers/**/src/*.ts',
        'astro.config.mjs',
        'eslint.config.js',
        'playwright.config.ts',
      ],
      exclude: ['**/*.d.ts', 'src/data/types.ts'],
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      thresholds: { perFile: true, lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
