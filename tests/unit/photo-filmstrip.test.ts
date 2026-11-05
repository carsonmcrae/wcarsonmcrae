/**
 * Purpose: Keep the native photo filmstrip selectable without moving the surrounding page.
 * Scope: Descriptive thumbnails, current-state painting, roving keys, bounded strip scrolling, and disposal.
 * Does NOT belong: Large-image loading, viewer modal behavior, or reaction requests.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initPhotoFilmstrip } from '../../src/lib/photo-filmstrip';
import { disposeDocument } from './helpers';

const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));

function fixture() {
  document.body.innerHTML = `<div id="strip"></div><div id="sources">
    <a href="/full-one.webp" data-photo="photo-one"><img alt="First photograph" srcset="/small-one.webp 320w, /large-one.webp 800w"></a>
    <a href="/full-two.webp" data-photo="photo-two"><img alt="Second photograph"></a>
    <a href="/full-three.webp" data-photo-alt="Third photograph">Open third</a></div>`;
  const strip = document.querySelector<HTMLElement>('#strip')!;
  const photos = [...document.querySelectorAll<HTMLAnchorElement>('#sources a')];
  const select = vi.fn((index: number) => filmstrip.paint(index));
  const filmstrip = initPhotoFilmstrip(strip, select);
  stops.push(filmstrip.destroy);
  const scroll = vi.spyOn(strip, 'scrollTo');
  const key = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    strip.dispatchEvent(event);
    return event;
  };
  return { strip, photos, select, filmstrip, scroll, key };
}

it('builds descriptive native buttons and lazy decorative thumbnails with one current tab stop', () => {
  const f = fixture();
  f.filmstrip.set(f.photos, 1);
  const buttons = [...f.strip.querySelectorAll('button')];
  expect(f.strip.hidden).toBe(false);
  expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
    'Photo 1 of 3: First photograph',
    'Photo 2 of 3: Second photograph',
    'Photo 3 of 3: Third photograph',
  ]);
  expect(buttons.map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
  expect(buttons[1]!.getAttribute('aria-current')).toBe('true');
  expect(buttons[0]!.hasAttribute('aria-current')).toBe(false);
  for (const button of buttons) {
    expect(button.type).toBe('button');
    const image = button.querySelector('img')!;
    expect(image.alt).toBe('');
    expect(image.loading).toBe('lazy');
    expect(image.decoding).toBe('async');
  }
  expect(buttons[0]!.querySelector('img')!.getAttribute('src')).toBe('/small-one.webp');
  expect(buttons[1]!.querySelector('img')!.src).toBe(f.photos[1]!.href);
});

it('selects clicked thumbnails and wraps roving arrow keys while isolating keyboard events', () => {
  const f = fixture();
  f.filmstrip.set(f.photos, 0);
  const buttons = [...f.strip.querySelectorAll('button')];
  const focus = vi.spyOn(buttons[2]!, 'focus');
  buttons[2]!.querySelector('img')!.click();
  expect(f.select).toHaveBeenLastCalledWith(2);
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  const parentKeys = vi.fn();
  document.body.addEventListener('keydown', parentKeys);
  expect(f.key('ArrowRight').defaultPrevented).toBe(true);
  expect(f.select).toHaveBeenLastCalledWith(0);
  f.key('ArrowLeft');
  expect(f.select).toHaveBeenLastCalledWith(2);
  f.key('Home');
  expect(f.select).toHaveBeenLastCalledWith(0);
  f.key('End');
  expect(f.select).toHaveBeenLastCalledWith(2);
  expect(parentKeys).not.toHaveBeenCalled();
  expect(f.key('Tab').defaultPrevented).toBe(false);
  expect(parentKeys).toHaveBeenCalledOnce();
  document.body.removeEventListener('keydown', parentKeys);
  const calls = f.select.mock.calls.length;
  f.strip.append(document.createElement('button'));
  f.strip.lastElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const text = document.createTextNode('Unrelated');
  f.strip.append(text);
  text.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(f.select).toHaveBeenCalledTimes(calls);
});

it('centers only the strip, clamps both ends, and removes listeners and old album content', () => {
  const f = fixture();
  const pageScroll = vi.spyOn(window, 'scrollTo');
  f.filmstrip.set(f.photos, 0);
  Object.defineProperties(f.strip, { clientWidth: { value: 200 }, scrollWidth: { value: 600 } });
  for (const [index, button] of [...f.strip.querySelectorAll('button')].entries())
    Object.defineProperties(button, {
      offsetLeft: { value: index * 300 },
      offsetWidth: { value: 100 },
    });
  f.filmstrip.paint(0);
  expect(f.scroll).toHaveBeenLastCalledWith({ left: 0, behavior: 'instant' });
  f.filmstrip.paint(1);
  expect(f.scroll).toHaveBeenLastCalledWith({ left: 250, behavior: 'instant' });
  f.filmstrip.paint(2);
  expect(f.scroll).toHaveBeenLastCalledWith({ left: 400, behavior: 'instant' });
  expect(pageScroll).not.toHaveBeenCalled();
  f.filmstrip.set([f.photos[0]!], 0);
  expect(f.strip.hidden).toBe(true);
  expect(f.strip.querySelectorAll('button')).toHaveLength(1);
  f.filmstrip.set([], 0);
  expect(f.key('ArrowLeft').defaultPrevented).toBe(false);
  f.filmstrip.destroy();
  f.key('End');
  f.strip.click();
  expect(f.strip.childNodes).toHaveLength(0);
  expect(f.select).not.toHaveBeenCalled();
});
