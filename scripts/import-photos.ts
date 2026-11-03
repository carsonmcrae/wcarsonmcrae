/**
 * Purpose: Command-line entry that imports photos into the site (npm run images:import).
 * Scope: Reads every photo in a source folder (default photos-incoming/), renames it to a clean
 *   stem, resizes it so the long edge is at most 2000 px, re-encodes it with all metadata stripped,
 *   and writes it to src/assets/photos/. Existing outputs are skipped unless --force is given.
 * Constraints: Source files are never modified or deleted; photos-incoming/ is ignored by git.
 * Does NOT belong: The planning rules (scripts/lib/photo-import.ts) or placing photos on pages
 *   (src/data).
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import sharp from 'sharp';
import { findCollisions, isPhotoFile, planImport, type ImportStep } from './lib/photo-import.ts';

const root = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const sourceDir = resolve(root, args.find((arg) => !arg.startsWith('--')) ?? 'photos-incoming');
const outDir = join(root, 'src', 'assets', 'photos');

const names = (await readdir(sourceDir))
  .filter(isPhotoFile)
  .sort((a, b) => Number(a > b) - Number(a < b));
if (names.length === 0) {
  console.info(`No photos found in ${relative(root, sourceDir)}/.`);
}

const steps: ImportStep[] = [];
for (const name of names) {
  const meta = await sharp(join(sourceDir, name)).rotate().metadata();
  steps.push(
    planImport({ name, width: meta.width, height: meta.height, hasAlpha: Boolean(meta.hasAlpha) }),
  );
}
const collisions = findCollisions(steps);
if (collisions.length > 0) {
  console.error(`Two sources would share a name: ${collisions.join(', ')}. Rename one and retry.`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
for (const step of steps) {
  const target = join(outDir, step.output);
  const exists = await stat(target).then(
    () => true,
    () => false,
  );
  if (exists && !force) {
    console.info(`skip      ${step.output} (already imported; use --force to replace)`);
    continue;
  }
  // rotate() applies any EXIF orientation; sharp drops every other piece of metadata by default.
  let pipeline = sharp(join(sourceDir, step.source)).rotate();
  if (step.resize) {
    pipeline = pipeline.resize(step.resize.width, step.resize.height);
  }
  await pipeline.toFormat(step.format, step.options).toFile(target);
  const { size } = await stat(target);
  const dims = step.resize ? `${step.resize.width}×${step.resize.height}` : 'original size';
  console.info(
    `imported  ${step.output}  ${Math.round(size / 1024)} KB  ${dims}  from ${step.source}`,
  );
}
