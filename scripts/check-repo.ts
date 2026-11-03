/**
 * Purpose: Command-line entry for the repository gates (npm run check:repo).
 * Scope: Lists first-party files, reads them, runs the line-limit, file-header, and asset-size
 *   gates, prints the findings, and exits non-zero when any gate fails.
 * Does NOT belong: The rules themselves, which live in scripts/lib and are unit tested there.
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { checkAssetSizes } from './lib/asset-sizes.ts';
import { checkFileHeaders } from './lib/file-headers.ts';
import { checkLineLimits, type GateReport } from './lib/file-lines.ts';
import { listRepoFiles } from './lib/repo-files.ts';

const root = join(import.meta.dirname, '..');
const paths = listRepoFiles(root).filter((path) =>
  statSync(join(root, path), { throwIfNoEntry: false }),
);
const TEXT =
  /\.(?:astro|ts|mts|mjs|js|css|md|ya?ml|json|jsonc|svg|txt|webmanifest|toml)$|(?:^|\/)\.[\w-]+$|CODEOWNERS$/;
const texts = paths
  .filter((path) => TEXT.test(path))
  .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
const sizes = paths.map((path) => ({ path, bytes: statSync(join(root, path)).size }));

const gates: [string, GateReport][] = [
  ['Line limit', checkLineLimits(texts)],
  ['File headers', checkFileHeaders(texts)],
  ['Asset sizes', checkAssetSizes(sizes)],
];

let failed = false;
for (const [name, report] of gates) {
  for (const warning of report.warnings) console.warn(`  warn  ${warning}`);
  for (const error of report.errors) console.error(`  fail  ${error}`);
  failed ||= report.errors.length > 0;
  console.info(`${report.errors.length ? '✗' : '✓'} ${name}: ${report.checked} files checked`);
}
process.exitCode = failed ? 1 : 0;
