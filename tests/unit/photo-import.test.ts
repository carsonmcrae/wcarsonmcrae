/**
 * Purpose: Unit tests for scripts/lib/photo-import.ts.
 * Scope: Stem cleanup, format choice, resize math, and duplicate detection.
 * Does NOT belong: Running the import against real files (scripts/import-photos.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import {
  findCollisions,
  isPhotoFile,
  MAX_EDGE,
  planImport,
  resizeFor,
  toStem,
} from '../../scripts/lib/photo-import';

describe('toStem', () => {
  it('turns original filenames into clean asset names', () => {
    expect(toStem('Nicole_Carson_B&W_1.jpg')).toBe('nicole-carson-b-w-1');
    expect(toStem('My_First__Built_PC_13.jpg')).toBe('my-first-built-pc-13');
    expect(toStem('1999_Born.jpg')).toBe('1999-born');
    expect(toStem('Carson Headshot.PNG')).toBe('carson-headshot');
  });

  it('never returns an empty name', () => {
    expect(toStem('___.jpg')).toBe('photo');
  });
});

describe('isPhotoFile', () => {
  it('recognizes photo extensions regardless of case', () => {
    expect(isPhotoFile('a.JPG')).toBe(true);
    expect(isPhotoFile('a.webp')).toBe(true);
    expect(isPhotoFile('notes.txt')).toBe(false);
  });
});

describe('resizeFor', () => {
  it('leaves small images alone', () => {
    expect(resizeFor(1448, 1086)).toBeNull();
    expect(resizeFor(MAX_EDGE, 100)).toBeNull();
  });

  it('scales the long edge down to the limit and keeps the aspect ratio', () => {
    expect(resizeFor(2160, 2880)).toEqual({ width: 1500, height: 2000 });
    expect(resizeFor(3240, 2160)).toEqual({ width: 2000, height: 1333 });
  });
});

describe('planImport', () => {
  it('writes opaque photos as JPEG', () => {
    expect(
      planImport({ name: '1999_Born.jpg', width: 2160, height: 2880, hasAlpha: false }),
    ).toEqual({
      source: '1999_Born.jpg',
      stem: '1999-born',
      output: '1999-born.jpg',
      format: 'jpeg',
      options: { quality: 85, mozjpeg: true },
      resize: { width: 1500, height: 2000 },
    });
  });

  it('keeps transparency by writing WebP', () => {
    const step = planImport({
      name: 'Carson_Headshot.png',
      width: 1122,
      height: 1402,
      hasAlpha: true,
    });
    expect(step.output).toBe('carson-headshot.webp');
    expect(step.format).toBe('webp');
    expect(step.options).toEqual({ quality: 90 });
    expect(step.resize).toBeNull();
  });
});

describe('findCollisions', () => {
  it('reports stems that two sources would share', () => {
    const steps = ['Margot 1.jpg', 'margot-1.png', 'Quinn_1.jpg'].map((name) =>
      planImport({ name, width: 10, height: 10, hasAlpha: false }),
    );
    expect(findCollisions(steps)).toEqual(['margot-1']);
    expect(findCollisions(steps.slice(2))).toEqual([]);
  });
});
