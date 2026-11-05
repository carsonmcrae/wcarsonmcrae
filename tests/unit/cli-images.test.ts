/**
 * Purpose: Verify image command composition without touching approved photographs or brand assets.
 * Scope: Real planning/encoding/export rules with bounded in-memory filesystem and codec boundaries.
 * Does NOT belong: Pixel fidelity tests (brand-assets.test.ts) or privacy approval of source photos.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { basename, join, resolve } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const io = vi.hoisted(() => ({
  files: new Map<string, string | Buffer>(),
  metadata: new Map<string, object>(),
  names: [] as string[],
  pipelines: [] as {
    input: string | Buffer;
    rotate: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    png: ReturnType<typeof vi.fn>;
    toFormat: ReturnType<typeof vi.fn>;
    toFile: ReturnType<typeof vi.fn>;
  }[],
  mkdir: vi.fn(),
  readdir: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  copy: vi.fn(),
  rename: vi.fn(),
  stat: vi.fn(),
  sharp: vi.fn(),
  font: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
  mkdir: io.mkdir,
  readdir: io.readdir,
  readFile: io.read,
  writeFile: io.write,
  copyFile: io.copy,
  rename: io.rename,
  stat: io.stat,
}));
vi.mock('sharp', () => ({ default: io.sharp }));
vi.mock('fontkit', () => ({ openSync: io.font }));

const root = resolve(import.meta.dirname, '../..');
const photos = join(root, 'src/assets/photos');
const source = join(root, 'photos-incoming');
const publicDir = join(root, 'public');
const previousArgv = process.argv;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  io.files.clear();
  io.metadata.clear();
  io.names = [];
  io.pipelines = [];
  process.argv = ['node', 'image-command'];
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  io.mkdir.mockResolvedValue(undefined);
  io.readdir.mockImplementation(async () => io.names);
  io.read.mockImplementation(async (path: string, encoding?: string) => {
    const data = io.files.get(path) ?? 'external licensed resource';
    return encoding ? String(data) : Buffer.from(data);
  });
  io.write.mockImplementation(async (path: string, data: Buffer | string) => {
    io.files.set(path, data);
  });
  io.copy.mockImplementation(async (from: string, to: string) => {
    io.files.set(to, io.files.get(from) ?? 'licensed resource');
  });
  io.rename.mockImplementation(async (from: string, to: string) => {
    io.files.set(to, io.files.get(from)!);
    io.files.delete(from);
  });
  io.stat.mockImplementation(async (path: string) => {
    if (!io.files.has(path)) throw new Error('ENOENT');
    return { size: Buffer.byteLength(io.files.get(path)!) };
  });
  io.sharp.mockImplementation((input: string | Buffer) => {
    const key = Buffer.isBuffer(input) ? input.toString() : basename(input);
    const pipeline = {
      input,
      rotate: vi.fn().mockReturnThis(),
      resize: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      metadata: vi
        .fn()
        .mockImplementation(async () => io.metadata.get(key) ?? { width: 800, height: 600 }),
      toFile: vi.fn().mockImplementation(async (path: string) => {
        io.files.set(path, Buffer.from(`encoded:${key}`));
      }),
    };
    io.pipelines.push(pipeline);
    return pipeline;
  });
  io.font.mockReturnValue({
    getVariation: vi.fn().mockReturnValue({
      unitsPerEm: 1000,
      layout: (text: string) => ({
        glyphs: [{ path: { toSVG: () => 'M0 0L1 1Z' } }],
        positions: [{ xAdvance: text.length * 500, xOffset: 0, yOffset: 0 }],
      }),
    }),
  });
});
afterEach(() => {
  process.argv = previousArgv;
});

describe('photo import CLI', () => {
  it('reports an empty source without processing non-photo files', async () => {
    io.names = ['notes.txt'];
    await import('../../scripts/import-photos.ts');
    expect(io.readdir).toHaveBeenCalledWith(source);
    expect(io.sharp).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith('No photos found in photos-incoming/.');
  });
  it('sorts photos, rotates first, applies real resize/format plans, and writes only outputs', async () => {
    io.names = ['z.png', 'a.jpg', 'notes.txt'];
    io.metadata.set('a.jpg', { width: 4000, height: 2000, hasAlpha: false });
    io.metadata.set('z.png', { width: 100, height: 50, hasAlpha: true });
    await import('../../scripts/import-photos.ts');
    expect(io.pipelines.slice(0, 2).map((pipeline) => basename(String(pipeline.input)))).toEqual([
      'a.jpg',
      'z.png',
    ]);
    const [large, small] = io.pipelines.slice(2);
    expect(large!.rotate).toHaveBeenCalledOnce();
    expect(large!.resize).toHaveBeenCalledWith(2000, 1000);
    expect(large!.toFormat).toHaveBeenCalledWith('jpeg', { quality: 85, mozjpeg: true });
    expect(large!.toFile).toHaveBeenCalledWith(join(photos, 'a.jpg'));
    expect(small!.resize).not.toHaveBeenCalled();
    expect(small!.toFormat).toHaveBeenCalledWith('webp', { quality: 90 });
    expect(small!.toFile).toHaveBeenCalledWith(join(photos, 'z.webp'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('2000×1000'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('original size'));
    expect(io.rename).not.toHaveBeenCalled();
    expect([...io.files.keys()]).toEqual([join(photos, 'a.jpg'), join(photos, 'z.webp')]);
  });
  it('keeps an existing output unless the explicit --force option is supplied', async () => {
    io.names = ['a.jpg'];
    io.files.set(join(photos, 'a.jpg'), 'existing approved photo');
    await import('../../scripts/import-photos.ts');
    expect(io.pipelines).toHaveLength(1);
    expect(io.files.get(join(photos, 'a.jpg'))).toBe('existing approved photo');
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('already imported'));
    vi.resetModules();
    process.argv = ['node', 'import', 'approved-input', '--force'];
    await import('../../scripts/import-photos.ts');
    expect(io.readdir).toHaveBeenLastCalledWith(join(root, 'approved-input'));
    expect(io.files.get(join(photos, 'a.jpg'))).toEqual(Buffer.from('encoded:a.jpg'));
  });
  it('stops collisions before creating output or overwriting a photograph', async () => {
    io.names = ['A!.jpg', 'A_.png'];
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Collision stop');
    });
    await expect(import('../../scripts/import-photos.ts')).rejects.toThrow('Collision stop');
    expect(exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Two sources would share a name: a.'),
    );
    expect(io.mkdir).not.toHaveBeenCalled();
    expect(io.files.size).toBe(0);
  });
  it('propagates a source read failure instead of reporting successful import', async () => {
    io.readdir.mockRejectedValueOnce(new Error('Source unavailable'));
    await expect(import('../../scripts/import-photos.ts')).rejects.toThrow('Source unavailable');
    expect(io.sharp).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });
});

describe('metadata stripping CLI', () => {
  it('reports no photographs without trying to rewrite other files', async () => {
    io.names = ['notes.md'];
    await import('../../scripts/strip-image-metadata.ts');
    expect(io.readdir).toHaveBeenCalledWith(photos);
    expect(io.read).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith('No photos found in src/assets/photos/.');
  });
  it('re-encodes each selected photo with orientation and replaces it through a temporary file', async () => {
    io.names = ['a.jpg', 'b.png', 'c.webp', 'd.avif', 'notes.txt'];
    const kinds = ['exif', 'xmp', 'iptc', 'none'];
    for (const [index, name] of io.names.slice(0, 4).entries()) {
      io.files.set(join(photos, name), name);
      io.metadata.set(name, { [kinds[index]!]: Buffer.from('private metadata') });
    }
    await import('../../scripts/strip-image-metadata.ts');
    expect(io.rename).toHaveBeenCalledTimes(4);
    expect(io.pipelines.filter((pipeline) => pipeline.rotate.mock.calls.length)).toHaveLength(4);
    expect(io.pipelines[1]!.toFormat).toHaveBeenCalledWith('jpeg', { quality: 90, mozjpeg: true });
    expect(io.pipelines[3]!.toFormat).toHaveBeenCalledWith('png', { compressionLevel: 9 });
    expect(io.pipelines[5]!.toFormat).toHaveBeenCalledWith('webp', { quality: 90 });
    expect(io.pipelines[7]!.toFormat).toHaveBeenCalledWith('avif', { quality: 70 });
    expect(io.rename).toHaveBeenCalledWith(`${join(photos, 'a.jpg')}.tmp`, join(photos, 'a.jpg'));
    expect([...io.files.keys()].some((path) => path.endsWith('.tmp'))).toBe(false);
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('clean   '));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('stripped'));
    for (const data of io.files.values()) expect(String(data)).toMatch(/^encoded:/);
  });
  it('honors explicitly named files and preserves an original if replacement fails', async () => {
    const path = join(root, 'approved.jpg');
    process.argv = ['node', 'strip', path];
    io.files.set(path, 'original');
    io.rename.mockRejectedValueOnce(new Error('Replacement denied'));
    await expect(import('../../scripts/strip-image-metadata.ts')).rejects.toThrow(
      'Replacement denied',
    );
    expect(io.readdir).not.toHaveBeenCalled();
    expect(io.files.get(path)).toBe('original');
    expect(io.files.has(`${path}.tmp`)).toBe(true);
    expect(console.info).not.toHaveBeenCalled();
  });
});

describe('brand export CLI', () => {
  it('writes the complete vector/raster/icon manifest and a real readable archive with licensing', async () => {
    await import('../../scripts/generate-brand-images.mjs');
    const kit = join(publicDir, 'brand');
    const mark = String(io.files.get(join(kit, 'daysforth-mark.svg')));
    const small = String(io.files.get(join(kit, 'daysforth-mark-small.svg')));
    expect(io.files.get(join(publicDir, 'favicon.svg'))).toBe(small);
    expect(small).not.toBe(mark);
    const icons = io.pipelines.slice(-5);
    expect(icons.map((pipeline) => pipeline.resize.mock.calls[0])).toEqual([
      [16, 16],
      [32, 32],
      [180, 180],
      [192, 192],
      [512, 512],
    ]);
    expect(String(icons[0]!.input)).toBe(small);
    expect(String(icons[4]!.input)).toBe(mark);
    expect(io.copy).toHaveBeenCalledWith(
      join(kit, 'daysforth-social.png'),
      join(publicDir, 'og-image.png'),
    );
    expect(io.files.has(join(kit, 'FONT-LICENSE.txt'))).toBe(true);
    expect(io.files.has(join(kit, 'ICON-LICENSE.txt'))).toBe(true);
    const manifest = JSON.parse(String(io.files.get(join(publicDir, 'site.webmanifest'))));
    expect(manifest).toMatchObject({
      start_url: './',
      scope: './',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    });
    const archive = unzipSync(io.files.get(join(kit, 'daysforth-brand-kit.zip')) as Buffer);
    expect(Object.keys(archive)).toHaveLength(37);
    expect(strFromU8(archive['daysforth-mark.svg']!)).toBe(mark);
    expect(strFromU8(archive['favicon.svg']!)).toBe(small);
    expect(archive['FONT-LICENSE.txt']).toBeDefined();
    expect(archive['ICON-LICENSE.txt']).toBeDefined();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Exported 13 vector originals'),
    );
  });
  it('fails before exporting when the brand directory cannot be created', async () => {
    io.mkdir.mockRejectedValueOnce(new Error('Output denied'));
    await expect(import('../../scripts/generate-brand-images.mjs')).rejects.toThrow(
      'Output denied',
    );
    expect(io.font).not.toHaveBeenCalled();
    expect(io.write).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });
});
