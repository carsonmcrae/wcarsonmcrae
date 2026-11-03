/**
 * Purpose: The 500-physical-line limit for every first-party text file.
 * Scope: Which files the limit covers, how physical lines are counted (blanks and comments
 *   included), the 400-line review warning, and the resulting report.
 * Constraints: Split files by responsibility before they reach the limit; never minify, and never
 *   add an exemption to pass. Only generated lockfiles are exempt.
 * Does NOT belong: Reading files from disk (scripts/check-repo.ts) or binary asset sizes
 *   (scripts/lib/asset-sizes.ts).
 */

export const LINE_LIMIT = 500;
const REVIEW_THRESHOLD = 400;

const CHECKED =
  /\.(?:astro|ts|mts|mjs|js|css|md|ya?ml|json|jsonc|svg|txt|webmanifest|toml)$|(?:^|\/)(?:\.gitignore|\.prettierignore|\.gitattributes|\.editorconfig|\.npmrc|CODEOWNERS)$/;
const EXEMPT = [/(?:^|\/)package-lock\.json$/];

export function isLineChecked(path: string): boolean {
  return CHECKED.test(path) && !EXEMPT.some((pattern) => pattern.test(path));
}

/** Physical lines: a trailing newline ends the last line rather than starting a new one. */
export function countLines(text: string): number {
  if (text === '') {
    return 0;
  }
  const lines = text.split('\n').length;
  return text.endsWith('\n') ? lines - 1 : lines;
}

export interface FileText {
  path: string;
  text: string;
}

export interface GateReport {
  checked: number;
  errors: string[];
  warnings: string[];
}

export function checkLineLimits(files: FileText[]): GateReport {
  const report: GateReport = { checked: 0, errors: [], warnings: [] };
  for (const file of files) {
    if (!isLineChecked(file.path)) {
      continue;
    }
    report.checked += 1;
    const lines = countLines(file.text);
    if (lines > LINE_LIMIT) {
      report.errors.push(
        `${file.path}: ${lines} lines (limit ${LINE_LIMIT}). Split it by responsibility.`,
      );
    } else if (lines > REVIEW_THRESHOLD) {
      report.warnings.push(
        `${file.path}: ${lines} lines, over ${REVIEW_THRESHOLD}. Consider splitting it.`,
      );
    }
  }
  return report;
}
