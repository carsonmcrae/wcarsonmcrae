/**
 * Purpose: Vitest configuration for the unit tests under tests/unit.
 * Scope: The test file pattern, hang guards, and the V8 coverage contract: 100% statements,
 *   branches, functions, and lines for every executable source file, checked per file.
 * Constraints: Never lower a threshold or exclude a file to pass; extract and test the logic.
 * Does NOT belong: Checks against the built site (vitest.build.config.ts) or browser tests
 *   (playwright.config.ts).
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
      // The CLI entry points in scripts/*.ts are thin wrappers; their logic lives in scripts/lib.
      include: ['src/lib/**/*.ts', 'src/data/**/*.ts', 'scripts/lib/**/*.ts'],
      exclude: ['**/*.d.ts', 'src/data/types.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { perFile: true, lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
