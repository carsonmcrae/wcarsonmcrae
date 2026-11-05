/**
 * Purpose: Verify cover reservation CSS uses trusted source dimensions and fails on missing media.
 * Scope: Photo/screenshot lookup, native ratios, project-only fallback, and the static endpoint contract.
 * Does NOT belong: Browser sizing or image decoding behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mediaFrameStyles } from '../../src/lib/media-frames';
import { getPhoto, getProjectImage } from '../../src/lib/images';
import { timelinePosts } from '../../src/data/timeline';
import { GET } from '../../src/pages/media-frames.css';

vi.mock('../../src/lib/images', () => ({ getPhoto: vi.fn(), getProjectImage: vi.fn() }));
const post = {
  id: 'cover',
  date: '2026-11',
  title: 'Cover',
  caption: '',
  body: [],
  category: 'Life' as const,
};
afterEach(() => vi.resetAllMocks());
function knownDimensions() {
  vi.mocked(getPhoto).mockReturnValue({ width: 600, height: 900 } as ReturnType<typeof getPhoto>);
  vi.mocked(getProjectImage).mockReturnValue({ width: 1280, height: 721 } as ReturnType<
    typeof getProjectImage
  >);
}

describe('known media dimensions', () => {
  it('reserves portrait and screenshot ratios without inline styles or distorted dimensions', () => {
    knownDimensions();
    const css = mediaFrameStyles([
      { ...post, image: 'portrait' },
      { ...post, image: 'screen', imageKind: 'screen' },
    ]);
    expect(css).toContain('[data-moment-image="portrait"]');
    expect(css).toContain('--media-ratio: 600 / 900;');
    expect(css).toContain('[data-moment-image="screen"]');
    expect(css).toContain('--media-ratio: 1280 / 721;');
    expect(getPhoto).toHaveBeenCalledWith('portrait');
    expect(getProjectImage).toHaveBeenCalledWith('screen');
  });
  it('leaves native app-icon sizing alone and does not invent metadata for absent covers', () => {
    expect(mediaFrameStyles([])).toBe('');
    expect(mediaFrameStyles([{ ...post, project: 'app' }])).toBe('');
    expect(getProjectImage).not.toHaveBeenCalled();
    expect(() => mediaFrameStyles([{ ...post, image: 'missing' }])).toThrow(
      'Missing timeline cover: missing',
    );
  });
  it('serves every approved image cover with a stylesheet content type', async () => {
    knownDimensions();
    const response = GET();
    expect(response.headers.get('Content-Type')).toBe('text/css; charset=utf-8');
    const css = await response.text();
    for (const item of timelinePosts.filter((item) => item.image)) {
      expect(css).toContain(`[data-moment-image=${JSON.stringify(item.image)}]`);
    }
  });
});
