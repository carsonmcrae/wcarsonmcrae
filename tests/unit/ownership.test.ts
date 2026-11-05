/**
 * Purpose: Keep ownership enforcement scoped to original commentable source.
 * Scope: Valid notices, missing/incomplete headers, and non-commentable or fixture materials.
 * Does NOT belong: Legal opinions or rewriting third-party licenses.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { checkOwnership, OWNERSHIP_LICENSE, OWNERSHIP_NOTICE } from '../../scripts/lib/ownership';

describe('ownership notices', () => {
  it('accepts original source notices in its existing documentation header', () => {
    const report = checkOwnership([
      {
        path: 'src/lib/example.ts',
        text: `/**\n * ${OWNERSHIP_NOTICE}\n * ${OWNERSHIP_LICENSE}\n */`,
      },
      { path: '.github/owner.yml', text: `# ${OWNERSHIP_NOTICE}\n# ${OWNERSHIP_LICENSE}\n` },
      {
        path: 'workers/migration.sql',
        text: `-- ${OWNERSHIP_NOTICE}\n-- ${OWNERSHIP_LICENSE}\nCREATE TABLE sample (id TEXT);`,
      },
    ]);
    expect(report).toEqual({ checked: 3, errors: [], warnings: [] });
  });
  it('reports absent or incomplete source notices without requiring invalid asset comments', () => {
    const report = checkOwnership([
      { path: 'src/lib/absent.ts', text: 'export const value = 1;' },
      { path: 'src/lib/incomplete.ts', text: `/** ${OWNERSHIP_NOTICE} */` },
      { path: 'src/lib/license-only.ts', text: `/** ${OWNERSHIP_LICENSE} */` },
      { path: 'package.json', text: '{}' },
      { path: 'public/brand/FONT-LICENSE.txt', text: 'An upstream license.' },
      { path: 'tests/fixtures/vendor.ts', text: 'Third-party fixture.' },
    ]);
    expect(report.checked).toBe(3);
    expect(report.errors).toHaveLength(3);
    expect(report.errors[0]).toContain('src/lib/absent.ts');
  });
});
