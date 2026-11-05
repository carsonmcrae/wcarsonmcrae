/**
 * Purpose: Exercise complete photo albums through the real shared viewer contract.
 * Scope: Duplicate entry links, captions, circular controls, keys, touch gestures, and cleanup.
 * Does NOT belong: Image processing or browser layout measurements.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it } from 'vitest';
import { initPhotoViewer } from '../../src/lib/photo-viewer';
import { albumPhotos, photoDetails } from '../../src/lib/photo-albums';
const stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  document.body.innerHTML = '';
});
function fixture() {
  document.body.innerHTML = `<a href="/1.webp" data-photo data-photo-album="dogs" data-photo-alt="First dog" data-photo-caption="First caption" data-photo-post="/posts/dogs/" id="entry">View photos</a>
  <div>${[1, 2, 3].map((number) => `<a href="/${number}.webp" data-photo data-photo-album="dogs"><img alt="Dog ${number}"></a>`).join('')}</div>
  <a href="/other.webp" data-photo data-photo-album="other"><img alt="Other photo"></a>
  <dialog data-photo-viewer><button data-photo-close>Close</button><p data-photo-count></p><figure data-photo-stage><img data-photo-large><figcaption data-photo-caption-output></figcaption></figure><button data-photo-previous>Previous</button><button data-photo-next>Next</button><a data-photo-related hidden>Moment</a></dialog>`;
  stops.push(initPhotoViewer(document));
  const dialog = document.querySelector('dialog')!;
  const entry = document.querySelector<HTMLAnchorElement>('#entry')!;
  const key = (value: string) =>
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    );
  const swipe = (start: [number, number][], end: [number, number][]) => {
    for (const [name, points] of [
      ['touchstart', start],
      ['touchend', end],
    ] as const) {
      const event = new Event(name, { bubbles: true });
      Object.defineProperty(event, name === 'touchstart' ? 'touches' : 'changedTouches', {
        value: points.map(([clientX, clientY]) => ({ clientX, clientY })),
      });
      dialog.querySelector('figure')!.dispatchEvent(event);
    }
  };
  return {
    dialog,
    entry,
    key,
    swipe,
    image: dialog.querySelector('img')!,
    count: dialog.querySelector('[data-photo-count]')!,
    next: dialog.querySelector<HTMLButtonElement>('[data-photo-next]')!,
    previous: dialog.querySelector<HTMLButtonElement>('[data-photo-previous]')!,
  };
}
it('resolves distinct album photos in order and preserves native single-photo descriptions', () => {
  const f = fixture();
  expect(albumPhotos(document, f.entry).map((photo) => new URL(photo.href).pathname)).toEqual([
    '/1.webp',
    '/2.webp',
    '/3.webp',
  ]);
  expect(photoDetails(f.entry)).toMatchObject({
    alt: 'First dog',
    caption: 'First caption',
    moment: '/posts/dogs/',
  });
  const standalone = document.createElement('a');
  standalone.innerHTML = '<img alt="Standalone">';
  document.body.append(standalone);
  expect(albumPhotos(document, standalone)).toEqual([standalone]);
  expect(photoDetails(standalone)).toMatchObject({
    alt: 'Standalone',
    caption: 'Standalone',
    moment: undefined,
  });
});
it('opens at the chosen photo, wraps with buttons and arrows, and returns focus to its exact entry', () => {
  const f = fixture();
  f.next.click();
  f.entry.click();
  expect(f.image.alt).toBe('First dog');
  expect(f.count.textContent).toBe('Photo 1 of 3');
  expect(f.next.hidden).toBe(false);
  f.previous.click();
  expect(f.count.textContent).toBe('Photo 3 of 3');
  f.next.click();
  expect(f.count.textContent).toBe('Photo 1 of 3');
  f.key('ArrowRight');
  expect(f.image.alt).toBe('Dog 2');
  expect(f.dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!.hidden).toBe(true);
  f.key('ArrowLeft');
  expect(f.image.alt).toBe('First dog');
  f.key('Enter');
  expect(f.count.textContent).toBe('Photo 1 of 3');
  f.dialog.querySelector<HTMLButtonElement>('[data-photo-close]')!.click();
  expect(document.activeElement).toBe(f.entry);
  const third = document.querySelector<HTMLAnchorElement>('a[href="/3.webp"]')!;
  third.click();
  expect(f.count.textContent).toBe('Photo 3 of 3');
  f.dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  expect(document.activeElement).toBe(third);
  document.querySelector<HTMLAnchorElement>('a[data-photo-album="other"]')!.click();
  expect(f.next.hidden).toBe(true);
  expect(f.previous.hidden).toBe(true);
  expect((f.count as HTMLElement).hidden).toBe(true);
});
it('accepts deliberate horizontal swipes while ignoring taps, vertical motion, missing touches and pinches', () => {
  const f = fixture();
  f.entry.click();
  for (const [start, end] of [
    [[], [[20, 20]]],
    [[[0, 0]], []],
    [
      [
        [0, 0],
        [10, 10],
      ],
      [[100, 0]],
    ],
    [[[0, 0]], [[20, 0]]],
    [[[0, 0]], [[100, 200]]],
  ] as [number, number][][][])
    f.swipe(start!, end!);
  expect(f.count.textContent).toBe('Photo 1 of 3');
  f.swipe([[100, 0]], [[0, 0]]);
  expect(f.count.textContent).toBe('Photo 2 of 3');
  f.swipe([[0, 0]], [[100, 0]]);
  expect(f.count.textContent).toBe('Photo 1 of 3');
  const stop = stops.pop()!;
  stop();
  f.next.click();
  f.key('ArrowRight');
  f.swipe([[100, 0]], [[0, 0]]);
  expect(f.count.textContent).toBe('Photo 1 of 3');
});
