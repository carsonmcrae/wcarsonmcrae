/**
 * Purpose: Requires a documentation header on every hand-written file that can carry a comment.
 * Scope: Maps each file type to its comment syntax, finds the opening comment (after a shebang,
 *   `// @ts-check` line, or Astro frontmatter fence), and checks that it states `Purpose`,
 *   `Scope`, and `Does NOT belong` with real values.
 * Constraints: The gate checks the shape, never the prose. Strict JSON, Markdown, `.nvmrc`,
 *   lockfiles, and binary or image assets cannot or need not carry a header.
 * Does NOT belong: The line limit (scripts/lib/file-lines.ts) or reading files from disk.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { FileText, GateReport } from './file-lines.ts';

export type CommentStyle = 'block' | 'astro' | 'hash' | 'slash' | 'dash';

const REQUIRED_FIELDS = ['Purpose', 'Scope', 'Does NOT belong'] as const;

const STYLES: [RegExp, CommentStyle][] = [
  [/\.(?:ts|mts|mjs|js|css)$/, 'block'],
  [/\.astro$/, 'astro'],
  [/\.sql$/, 'dash'],
  [
    /\.(?:ya?ml|toml)$|(?:^|\/)(?:\.gitignore|\.prettierignore|\.gitattributes|\.editorconfig|\.npmrc|CODEOWNERS)$/,
    'hash',
  ],
  [/(?:^|\/)tsconfig(?:\.[\w-]+)?\.json$|\.jsonc$/, 'slash'],
];

const EXEMPT = [/\.d\.ts$/, /^tests\/fixtures\//];

export function commentStyleFor(path: string): CommentStyle | null {
  if (EXEMPT.some((pattern) => pattern.test(path))) {
    return null;
  }
  return STYLES.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}

const PREAMBLE = /^(?:#!.*|\/\/ @ts-check|---)$/;

function blockComment(lines: string[]): string | null {
  if (!lines[0]?.trimStart().startsWith('/*')) {
    return null;
  }
  const end = lines.findIndex((line) => line.includes('*/'));
  return end === -1 ? null : lines.slice(0, end + 1).join('\n');
}

function lineComment(lines: string[], marker: string): string | null {
  const end = lines.findIndex((line) => !line.trimStart().startsWith(marker));
  const comment = lines.slice(0, end === -1 ? lines.length : end);
  return comment.length > 0 ? comment.join('\n') : null;
}

/** Returns the file's opening comment, or null when it does not open with one. */
export function extractHeader(text: string, style: CommentStyle): string | null {
  const lines = text.split('\n');
  while (lines.length > 0 && PREAMBLE.test(lines[0]!.trim())) {
    lines.shift();
  }
  if (style === 'hash') {
    return lineComment(lines, '#');
  }
  if (style === 'slash') {
    return lineComment(lines, '//');
  }
  if (style === 'dash') {
    return lineComment(lines, '--');
  }
  return blockComment(lines);
}

const PLACEHOLDER = /^(?:todo|tbd|tbc|\.\.\.|-|n\/a|xxx)?\.?$/i;

export function headerProblems(header: string | null): string[] {
  if (header === null) {
    return ['does not open with a documentation comment'];
  }
  const problems: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const match = new RegExp(String.raw`${field}:[ \t]*([^\n]*)`).exec(header);
    if (!match) {
      problems.push(`header is missing "${field}:"`);
      continue;
    }
    // The capture group always participates (it may be empty), so String() never sees undefined.
    const value = String(match[1])
      .replace(/\*\/\s*$/, '')
      .trim();
    if (PLACEHOLDER.test(value)) {
      problems.push(`header "${field}:" has no real value`);
    }
  }
  return problems;
}

export function checkFileHeaders(files: FileText[]): GateReport {
  const report: GateReport = { checked: 0, errors: [], warnings: [] };
  for (const file of files) {
    const style = commentStyleFor(file.path);
    if (!style) {
      continue;
    }
    report.checked += 1;
    for (const problem of headerProblems(extractHeader(file.text, style))) {
      report.errors.push(`${file.path}: ${problem}`);
    }
  }
  return report;
}
