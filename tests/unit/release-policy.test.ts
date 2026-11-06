/**
 * Purpose: Verify real release and architectural maintenance failures before publication.
 * Scope: Manifest drift, release history, note content, tag identity, and base-change requirements.
 * Does NOT belong: Git process behavior or presentation of release pages.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { checkReleasePolicy } from '../../scripts/lib/release-policy';
import { currentVersion, releases } from '../../src/data/releases';

const release = (version = '1.0.0') => ({
  version,
  date: '2026-11-03',
  title: 'An update',
  summary: 'Useful changes.',
  sections: [{ id: 'changes', title: 'Changes', items: ['Browse moments.'] }],
});
const valid = () => ({
  version: '1.0.0',
  lockVersion: '1.0.0',
  lockPackageVersion: '1.0.0',
  releases: [release()],
  changes: [] as { status: string; path: string }[],
});
const check = (overrides: Partial<Parameters<typeof checkReleasePolicy>[0]>) =>
  checkReleasePolicy({ ...valid(), ...overrides });

describe('release consistency', () => {
  it('accepts the shipped visitor notes and the canonical version', () => {
    expect(
      check({
        version: currentVersion,
        lockVersion: currentVersion,
        lockPackageVersion: currentVersion,
        releases,
      }),
    ).toEqual([]);
    expect(check({ tag: 'v1.0.0', baseVersion: '1.0.0' })).toEqual([]);
  });
  it('rejects unstable versions and manifest drift', () => {
    expect(check({ version: '01.0.0' })).toContain(
      'package.json must use a stable MAJOR.MINOR.PATCH.',
    );
    expect(check({ lockVersion: '0.9.0' })).toContain(
      'Both package-lock.json versions must match package.json.',
    );
    expect(check({ lockPackageVersion: '0.9.0' })).toContain(
      'Both package-lock.json versions must match package.json.',
    );
  });
  it('requires current public notes', () => {
    expect(check({ releases: [] })).toContain(
      'The newest public release notes must match package.json.',
    );
    expect(check({ releases: [release('0.9.0')] })).toContain(
      'The newest public release notes must match package.json.',
    );
  });
  it('requires valid, unique, descending versions', () => {
    expect(check({ releases: [release('1.0.0-dev')] })).toContain(
      'Invalid release version: 1.0.0-dev.',
    );
    for (const versions of [
      ['1.0.0', '1.0.0'],
      ['1.0.0', '1.1.0'],
    ])
      expect(check({ releases: versions.map(release) })).toContain(
        'Release history must be unique and newest first.',
      );
    expect(check({ releases: [release(), release('0.9.1'), release('0.9.0')] })).toEqual([]);
  });
  it.each([
    '',
    '2026-11',
    '2026-1-05',
    '2026-11-05T00:00:00Z',
    '2026-00-01',
    '2026-13-01',
    '2026-02-29',
    '2026-04-31',
    '1900-02-29',
  ])('rejects a missing, partial, or impossible release date: %s', (date) => {
    expect(check({ releases: [{ ...release(), date }] })).toContain(
      'Release 1.0.0 needs a real YYYY-MM-DD calendar date.',
    );
  });
  it.each(['2024-02-29', '2000-02-29', '2026-11-05'])(
    'accepts a real full calendar date: %s',
    (date) => expect(check({ releases: [{ ...release(), date }] })).toEqual([]),
  );
  it('preserves the approved historical calendar dates', () => {
    expect(Object.fromEntries(releases.map(({ version, date }) => [version, date]))).toMatchObject({
      '1.0.0': '2026-11-03',
      '1.0.1': '2026-11-05',
      '1.1.0': '2026-11-05',
    });
  });
  it('reports an omitted date as a policy error rather than crashing the release check', () => {
    const undated = release();
    Reflect.deleteProperty(undated, 'date');
    expect(check({ releases: [undated] })).toContain(
      'Release 1.0.0 needs a real YYYY-MM-DD calendar date.',
    );
  });
  it('requires meaningful note content', () => {
    for (const patch of [{ title: ' ' }, { summary: '' }, { sections: [] }])
      expect(check({ releases: [{ ...release(), ...patch }] })).toContain(
        'Release 1.0.0 needs a title, summary, and change sections.',
      );
    const section = release().sections[0]!;
    for (const patch of [{ title: ' ' }, { items: [] }, { items: [''] }])
      expect(
        check({ releases: [{ ...release(), sections: [{ ...section, ...patch }] }] }),
      ).toContain('Release 1.0.0 contains an empty change section.');
    for (const sections of [[{ ...section, id: 'Not safe' }], [section, section]])
      expect(check({ releases: [{ ...release(), sections }] })).toContain(
        'Release 1.0.0 needs unique, URL-safe section IDs.',
      );
  });
  it('requires an exact tag', () => {
    expect(check({ tag: 'v0.9.0' })).toContain('Release tag must be v1.0.0.');
    expect(check({ tag: '' })).toContain('Release tag must be v1.0.0.');
  });
});

describe('change policy', () => {
  it('rejects invalid comparison versions and rollback', () => {
    expect(check({ baseVersion: 'dev' })).toContain(
      'The comparison base must have a stable version.',
    );
    expect(check({ baseVersion: '2.0.0' })).toContain('The product version cannot move backwards.');
    expect(check({ baseVersion: '0.9.0' })).toEqual([]);
  });
  it('requires a bump for each product boundary, while allowing documentation-only work', () => {
    for (const path of [
      'src/pages/index.astro',
      'public/favicon.svg',
      'workers/reactions/src/index.ts',
      'astro.config.mjs',
      'package.json',
      'package-lock.json',
    ])
      expect(check({ baseVersion: '1.0.0', changes: [{ status: 'M', path }] })).toContain(
        'Product changes require a version increase and matching public release notes.',
      );
    expect(check({ baseVersion: '1.0.0', changes: [{ status: 'M', path: 'README.md' }] })).toEqual(
      [],
    );
    expect(
      check({ baseVersion: '0.9.0', changes: [{ status: 'M', path: 'src/pages/index.astro' }] }),
    ).toEqual([]);
  });
  it('requires architecture review for boundary changes', () => {
    for (const path of [
      'astro.config.mjs',
      'package.json',
      'workers/reactions/wrangler.toml',
      'src/layouts/BaseLayout.astro',
      'src/lib/reaction-service.ts',
    ])
      expect(check({ changes: [{ status: 'M', path }] })).toContain(
        'Boundary changes require a reviewed update under docs/architecture/.',
      );
    for (const status of ['A', 'D'])
      expect(check({ changes: [{ status, path: 'src/components/Example.astro' }] })).toContain(
        'Boundary changes require a reviewed update under docs/architecture/.',
      );
    expect(check({ changes: [{ status: 'M', path: 'src/lib/theme.ts' }] })).toEqual([]);
    expect(check({ changes: [{ status: 'A', path: 'tests/unit/new.test.ts' }] })).toEqual([]);
    expect(
      check({
        changes: [
          { status: 'A', path: 'src/lib/new.ts' },
          { status: 'D', path: 'docs/architecture/overview.md' },
        ],
      }),
    ).toContain('Boundary changes require a reviewed update under docs/architecture/.');
    expect(
      check({
        changes: [
          { status: 'A', path: 'src/pages/new.astro' },
          { status: 'M', path: 'docs/architecture/overview.md' },
        ],
      }),
    ).toEqual([]);
  });
});
