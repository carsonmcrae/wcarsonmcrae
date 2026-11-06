/**
 * Purpose: Protect the explanatory app posts and the real-media Recalen cover.
 * Scope: App context, screen-gallery identity, and lossless approved artwork in the wide cover.
 * Does NOT belong: Shared gallery rendering or application behavior described by the posts.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { timelinePosts } from '../../src/data/timeline';

const projectAssets = join(import.meta.dirname, '../../src/assets/projects');
const coverSource = join(import.meta.dirname, '../../docs/design/recalen-cover.svg');

describe('explanatory app posts', () => {
  it.each([
    [
      'recalen',
      2,
      'Putting capture and recall into practice.',
      ['thought', 'file', 'search', 'calendar'],
    ],
    ['ttsnative', 4, 'Released as open source (MIT).', ['reader', 'desktop', 'updates', 'local']],
    [
      'picpledge',
      2,
      'Shipped software at my own wedding. In my defense, it worked.',
      ['event', 'private', 'Guests', 'pictures'],
    ],
    [
      'daysforth',
      1,
      'My own take on social media. You’re looking at the prototype.',
      ['timeline', 'Posts', 'category', 'save'],
    ],
  ] as const)(
    'adds practical context to the %s timeline caption and keeps the original detail paragraphs',
    (project, length, originalCaption, terms) => {
      const posts = timelinePosts.filter((post) => post.project === project);
      expect(posts).toHaveLength(1);
      const post = posts[0]!;
      expect(post.body).toHaveLength(length);
      expect(post.caption.startsWith(`${originalCaption} `)).toBe(true);
      for (const term of terms)
        expect(post.caption.slice(originalCaption.length).toLowerCase()).toContain(
          term.toLowerCase(),
        );
    },
  );

  it('features a wide Recalen cover and retains the original screen as a distinct secondary', () => {
    const post = timelinePosts.find((entry) => entry.project === 'recalen')!;
    expect(post).toMatchObject({
      image: 'recalen-cover',
      imageKind: 'screen',
      date: '2026-07',
    });
    expect(post.gallery).toEqual([
      expect.objectContaining({ name: 'recalen-interface', imageKind: 'screen' }),
    ]);
    expect(post.imageAlt).toContain('Recalen');
  });

  it('explains the first shipped desktop product and updates after installation', () => {
    const post = timelinePosts.find((entry) => entry.project === 'ttsnative')!;
    expect(post.body.join(' ')).toContain(
      'my first product to ship as a fully functional desktop app',
    );
    expect(post.body.join(' ')).toContain(
      'Once installed on your machine, TTSNative can receive app updates',
    );
  });
});

describe('approved Recalen artwork', () => {
  it('embeds the real logo and lossless screen pixels without altering either source', async () => {
    const svg = await readFile(coverSource, 'utf8');
    const embedded = Array.from(
      svg.matchAll(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g),
      (match) => Buffer.from(match[1]!, 'base64'),
    );
    expect(embedded).toHaveLength(2);
    expect(embedded[0]).toEqual(await readFile(join(projectAssets, 'recalen.png')));
    const original = await sharp(join(projectAssets, 'recalen-interface.webp')).raw().toBuffer();
    const embeddedScreen = await sharp(embedded[1]).raw().toBuffer();
    expect(embeddedScreen.equals(original)).toBe(true);
    expect(await sharp(embedded[1]).metadata()).not.toHaveProperty('exif');
    expect(await sharp(embedded[1]).metadata()).not.toHaveProperty('xmp');
    expect(await sharp(embedded[1]).metadata()).not.toHaveProperty('iptc');
  });

  it('renders the complete cover through the production image format within the asset cap', async () => {
    const svg = await readFile(coverSource);
    expect(svg.byteLength).toBeLessThan(1.5 * 1024 * 1024);
    expect(await sharp(svg).metadata()).toMatchObject({ width: 1600, height: 900 });
    const optimized = await sharp(svg).resize(1000).webp({ quality: 58 }).toBuffer();
    expect(await sharp(optimized).metadata()).toMatchObject({ format: 'webp', width: 1000 });
    const served = await readFile(join(projectAssets, 'recalen-cover.webp'));
    const expected = await sharp(svg).webp({ quality: 90 }).toBuffer();
    expect(served.equals(expected)).toBe(true);
    expect(served.byteLength).toBeLessThanOrEqual(250 * 1024);
    const metadata = await sharp(served).metadata();
    expect(metadata).toMatchObject({ format: 'webp', width: 1600, height: 900 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.iptc).toBeUndefined();
    // Sharp can silently omit unsupported embedded formats: ensure the real dark UI renders.
    const screen = await sharp(svg)
      .extract({ left: 700, top: 90, width: 800, height: 700 })
      .toBuffer();
    const stats = await sharp(screen).stats();
    for (const channel of stats.channels.slice(0, 3)) expect(channel.mean).toBeLessThan(100);
  });
});
