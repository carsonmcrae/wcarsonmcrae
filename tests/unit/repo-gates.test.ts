/**
 * Purpose: Unit tests for the repository gates in scripts/lib.
 * Scope: File listing, the 500-line limit, documentation headers, asset size caps, and the photo
 *   re-encoding choices, including their failure reports.
 * Does NOT belong: Running the gates against this repository (npm run check:repo does that).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { checkAssetSizes, formatBytes, KB } from '../../scripts/lib/asset-sizes';
import {
  checkFileHeaders,
  commentStyleFor,
  extractHeader,
  headerProblems,
} from '../../scripts/lib/file-headers';
import {
  checkLineLimits,
  countLines,
  isLineChecked,
  LINE_LIMIT,
} from '../../scripts/lib/file-lines';
import { encodingFor, isPhoto } from '../../scripts/lib/image-encoding';
import {
  byCodeUnit,
  gitListFiles,
  listRepoFiles,
  parseFileList,
} from '../../scripts/lib/repo-files';

const lines = (count: number) => 'x\n'.repeat(count);
const HEADER =
  '/**\n * Purpose: Does a thing.\n * Scope: The thing.\n * Does NOT belong: Other things.\n */\n';

describe('repo files', () => {
  it('parses, de-duplicates, and sorts git output', () => {
    expect(parseFileList('b.ts\0a.ts\0\0b.ts\0')).toEqual(['a.ts', 'b.ts']);
    expect(byCodeUnit('a', 'b')).toBe(-1);
    expect(byCodeUnit('b', 'a')).toBe(1);
    expect(byCodeUnit('a', 'a')).toBe(0);
  });

  it('uses the injected runner, and the real one lists this repository', () => {
    expect(listRepoFiles('/repo', () => 'z\0y\0')).toEqual(['y', 'z']);
    expect(listRepoFiles(process.cwd())).toContain('package.json');
    expect(gitListFiles(process.cwd())).toContain('astro.config.mjs');
  });
});

describe('line limit', () => {
  it('checks SQL migration lines and their native documentation headers', () => {
    expect(isLineChecked('workers/reactions/migrations/0003_identity_lookup.sql')).toBe(true);
    expect(commentStyleFor('migration.sql')).toBe('dash');
    const header =
      '-- Purpose: Index a lookup.\n-- Scope: The visitor index.\n-- Does NOT belong: HTTP handlers.';
    expect(
      extractHeader(`${header}\nCREATE INDEX visitor ON reactions(visitor_hash);`, 'dash'),
    ).toBe(header);
    expect(checkFileHeaders([{ path: 'migration.sql', text: header }]).errors).toEqual([]);
  });
  it('counts physical lines', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('a')).toBe(1);
    expect(countLines('a\n')).toBe(1);
    expect(countLines('a\n\nb')).toBe(3);
  });

  it('covers first-party text but not lockfiles or binaries', () => {
    expect(isLineChecked('src/pages/index.astro')).toBe(true);
    expect(isLineChecked('.github/workflows/ci.yml')).toBe(true);
    expect(isLineChecked('.gitignore')).toBe(true);
    expect(isLineChecked('package-lock.json')).toBe(false);
    expect(isLineChecked('public/og-image.png')).toBe(false);
  });

  it('fails files over the limit and warns over the review threshold', () => {
    const report = checkLineLimits([
      { path: 'big.ts', text: lines(LINE_LIMIT + 1) },
      { path: 'large.ts', text: lines(450) },
      { path: 'fine.ts', text: lines(LINE_LIMIT - 200) },
      { path: 'photo.png', text: lines(9999) },
    ]);
    expect(report.checked).toBe(3);
    expect(report.errors).toEqual([expect.stringContaining('big.ts: 501 lines')]);
    expect(report.warnings).toEqual([expect.stringContaining('large.ts: 450 lines')]);
  });
});

describe('file headers', () => {
  it('maps file types to comment styles', () => {
    expect(commentStyleFor('src/lib/paths.ts')).toBe('block');
    expect(commentStyleFor('src/styles/global.css')).toBe('block');
    expect(commentStyleFor('src/pages/index.astro')).toBe('astro');
    expect(commentStyleFor('.github/workflows/ci.yml')).toBe('hash');
    expect(commentStyleFor('.npmrc')).toBe('hash');
    expect(commentStyleFor('tsconfig.json')).toBe('slash');
    expect(commentStyleFor('knip.jsonc')).toBe('slash');
    expect(commentStyleFor('package.json')).toBeNull();
    expect(commentStyleFor('README.md')).toBeNull();
    expect(commentStyleFor('src/env.d.ts')).toBeNull();
  });

  it('finds the opening comment after a shebang, ts-check line, or frontmatter fence', () => {
    expect(extractHeader(`#!/usr/bin/env node\n${HEADER}code();`, 'block')).toContain('Purpose');
    expect(extractHeader(`// @ts-check\n${HEADER}`, 'block')).toContain('Scope');
    expect(extractHeader(`---\n${HEADER}import x from 'y';\n---`, 'astro')).toContain('Purpose');
    expect(extractHeader('# Purpose: a\n# Scope: b\nkey: value', 'hash')).toBe(
      '# Purpose: a\n# Scope: b',
    );
    expect(extractHeader('// Purpose: a\n// Scope: b', 'slash')).toBe('// Purpose: a\n// Scope: b');
  });

  it('returns null when a file does not open with a comment', () => {
    expect(extractHeader('const x = 1;\n/** Purpose: late */', 'block')).toBeNull();
    expect(extractHeader('/** never closed', 'block')).toBeNull();
    expect(extractHeader('key: value', 'hash')).toBeNull();
    expect(extractHeader('', 'slash')).toBeNull();
  });

  it('requires every field with a real value', () => {
    expect(headerProblems(null)).toEqual(['does not open with a documentation comment']);
    expect(headerProblems(HEADER)).toEqual([]);
    expect(headerProblems('/** Purpose: Thing. Scope: Stuff. Does NOT belong: Else. */')).toEqual(
      [],
    );
    expect(headerProblems('/**\n * Purpose: TODO\n * Scope:\n */')).toEqual([
      'header "Purpose:" has no real value',
      'header "Scope:" has no real value',
      'header is missing "Does NOT belong:"',
    ]);
  });

  it('reports each failing file and skips exempt ones', () => {
    const report = checkFileHeaders([
      { path: 'good.ts', text: HEADER },
      { path: 'bad.css', text: 'body {}' },
      { path: 'notes.md', text: '# Notes' },
    ]);
    expect(report.checked).toBe(2);
    expect(report.errors).toEqual(['bad.css: does not open with a documentation comment']);
  });
});

describe('asset sizes', () => {
  it('formats sizes for people', () => {
    expect(formatBytes(512)).toBe('1 KB');
    expect(formatBytes(300 * KB)).toBe('300 KB');
    expect(formatBytes(1536 * KB)).toBe('1.5 MB');
  });

  it('caps served files and source images separately', () => {
    const report = checkAssetSizes([
      { path: 'public/og-image.png', bytes: 40 * KB },
      { path: 'public/huge.png', bytes: 300 * KB },
      { path: 'src/assets/photos/carson.jpg', bytes: 1200 * KB },
      { path: 'src/assets/photos/raw.jpg', bytes: 4000 * KB },
      { path: 'src/pages/index.astro', bytes: 99_999 * KB },
    ]);
    expect(report.checked).toBe(4);
    expect(report.errors).toEqual([
      expect.stringContaining('public/huge.png: 300 KB exceeds the 256 KB cap'),
      expect.stringContaining('raw.jpg: 3.9 MB exceeds the 1.5 MB cap for a source image'),
    ]);
  });
});

describe('image encoding', () => {
  it('recognizes photos', () => {
    expect(isPhoto('margot.JPG')).toBe(true);
    expect(isPhoto('quinn.webp')).toBe(true);
    expect(isPhoto('notes.txt')).toBe(false);
  });

  it('keeps each format and uses high quality settings', () => {
    expect(encodingFor('a.png').format).toBe('png');
    expect(encodingFor('a.webp').format).toBe('webp');
    expect(encodingFor('a.avif').format).toBe('avif');
    expect(encodingFor('a.jpeg')).toEqual({
      format: 'jpeg',
      options: { quality: 90, mozjpeg: true },
    });
  });
});
