/**
 * Purpose: Vitest configuration for the checks that run against the built site.
 * Scope: Runs tests/build against dist/ (or DIST_DIR) after npm run build: links, metadata,
 *   sitemap, and size budgets.
 * Does NOT belong: Unit tests and coverage (vitest.config.ts) or browser tests
 *   (playwright.config.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/build/**/*.test.ts'],
    environment: 'node',
  },
});
