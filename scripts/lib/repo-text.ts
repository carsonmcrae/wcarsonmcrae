/**
 * Purpose: Recognize first-party text files without complex, overlapping regular expressions.
 * Scope: Text extensions shared by repository checks and explicit line-limited configuration names.
 * Does NOT belong: Reading files, checking headers, or deciding asset size limits.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { posix } from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.ts',
  '.mts',
  '.mjs',
  '.js',
  '.css',
  '.md',
  '.yaml',
  '.yml',
  '.json',
  '.jsonc',
  '.svg',
  '.txt',
  '.webmanifest',
  '.toml',
  '.sql',
]);
const LINE_CONFIGS = new Set([
  '.gitignore',
  '.prettierignore',
  '.gitattributes',
  '.editorconfig',
  '.npmrc',
  'CODEOWNERS',
]);

export function hasTextExtension(path: string): boolean {
  return TEXT_EXTENSIONS.has(path.slice(path.lastIndexOf('.')));
}

export function isLineLimitedConfig(path: string): boolean {
  return LINE_CONFIGS.has(posix.basename(path));
}

export function isRepositoryText(path: string): boolean {
  return (
    hasTextExtension(path) || /^\.[\w-]+$/.test(posix.basename(path)) || path.endsWith('CODEOWNERS')
  );
}
