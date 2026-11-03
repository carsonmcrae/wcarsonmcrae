/**
 * Purpose: Command-line entry that strips EXIF, XMP, and IPTC metadata from photos (npm run images:strip).
 * Scope: Re-encodes each photo in src/assets/photos/ (or the files named on the command line) in place,
 *   with its orientation applied, so GPS locations, camera serials, and timestamps never reach Git.
 * Does NOT belong: Choosing formats and quality (scripts/lib/image-encoding.ts) or optimizing images for
 *   the site, which Astro does at build time.
 */
import { readdir, rename, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { encodingFor, isPhoto } from './lib/image-encoding.ts';

const root = join(import.meta.dirname, '..');
const photosDir = join(root, 'src', 'assets', 'photos');
const named = process.argv.slice(2);
const targets = named.length
  ? named
  : (await readdir(photosDir)).filter(isPhoto).map((name) => join(photosDir, name));

if (targets.length === 0) console.info('No photos found in src/assets/photos/.');
for (const file of targets) {
  const before = await sharp(file).metadata();
  const encoding = encodingFor(file);
  const temp = `${file}.tmp`;
  // rotate() bakes in the EXIF orientation; sharp drops all metadata unless asked to keep it.
  await sharp(file).rotate().toFormat(encoding.format, encoding.options).toFile(temp);
  await rename(temp, file);
  const { size } = await stat(file);
  const status = before.exif || before.xmp || before.iptc ? 'stripped' : 'clean   ';
  console.info(`${status}  ${relative(root, file)}  (${Math.round(size / 1024)} KB)`);
}
