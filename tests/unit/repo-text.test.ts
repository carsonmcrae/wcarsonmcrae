/**
 * Purpose: Keep repository file classification equivalent while simplifying gate expressions.
 * Scope: Every governed extension, hidden/config basenames, lockfiles, and non-text near misses.
 * Does NOT belong: Filesystem reading or enforcement of individual file contents.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import {
  hasTextExtension,
  isLineLimitedConfig,
  isRepositoryText,
} from '../../scripts/lib/repo-text';
import { isLineChecked } from '../../scripts/lib/file-lines';

describe('repository text classification', () => {
  it.each([
    'astro',
    'ts',
    'mts',
    'mjs',
    'js',
    'css',
    'md',
    'yaml',
    'yml',
    'json',
    'jsonc',
    'svg',
    'txt',
    'webmanifest',
    'toml',
  ])('recognizes %s and hidden extension-only names', (extension) => {
    expect(hasTextExtension(`src/example.${extension}`)).toBe(true);
    expect(isRepositoryText(`src/example.${extension}`)).toBe(true);
    expect(isLineChecked(`src/example.${extension}`)).toBe(true);
    expect(hasTextExtension(`.${extension}`)).toBe(true);
  });
  it.each([
    '.gitignore',
    '.prettierignore',
    '.gitattributes',
    '.editorconfig',
    '.npmrc',
    'CODEOWNERS',
  ])('retains named configuration %s at any directory depth', (name) => {
    expect(isLineLimitedConfig(name)).toBe(true);
    expect(isLineChecked(`nested/${name}`)).toBe(true);
    expect(isRepositoryText(`nested/${name}`)).toBe(true);
  });
  it('preserves the distinction between readable dotfiles and line-limited configs', () => {
    expect(isRepositoryText('.nvmrc')).toBe(true);
    expect(isRepositoryText('nested/.tool-config')).toBe(true);
    expect(isLineChecked('.nvmrc')).toBe(false);
    expect(isRepositoryText('myCODEOWNERS')).toBe(true);
    expect(isLineChecked('myCODEOWNERS')).toBe(false);
    expect(isRepositoryText('package-lock.json')).toBe(true);
    expect(isLineChecked('nested/package-lock.json')).toBe(false);
  });
  it.each(['image.png', 'file.TS', 'README', 'folder.ts/image.jpg', '.not.a-config'])(
    'rejects non-text or unsupported name %s',
    (path) => {
      expect(hasTextExtension(path)).toBe(false);
      expect(isLineLimitedConfig(path)).toBe(false);
      expect(isRepositoryText(path)).toBe(false);
      expect(isLineChecked(path)).toBe(false);
    },
  );
});
