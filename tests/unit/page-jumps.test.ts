/**
 * Purpose: Protect deliberate secondary-page edge navigation without new persistence.
 * Scope: Modest genuine travel, useful directions, short pages, modal guards, focus, and teardown.
 * Does NOT belong: Timeline dates, browser pixels, or shared input classification.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initPageJumps } from '../../src/lib/page-jumps';
import { disposeDocument } from './helpers';
const stops: (() => void)[] = [];
afterEach(() => {
  window.scrollTo(0, 0);
  disposeDocument(stops);
});
function page() {
  document.body.innerHTML =
    '<main tabindex="-1"></main><footer></footer><button data-page-edge="top" hidden></button><button data-page-edge="bottom" hidden></button>';
  const up = document.querySelector<HTMLButtonElement>('[data-page-edge="top"]')!;
  const down = document.querySelector<HTMLButtonElement>('[data-page-edge="bottom"]')!;
  const height = vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  const move = (top: number) => {
    window.scrollTo(0, top);
    window.dispatchEvent(new Event('scroll'));
  };
  return { up, down, height, move, hidden: () => [up.hidden, down.hidden] };
}

it('does nothing without the complete page controls and landmarks', () => {
  const listener = vi.spyOn(window, 'addEventListener');
  for (const markup of [
    '<button data-page-edge="top"></button>',
    '<button data-page-edge="bottom"></button>',
    '<main></main>',
  ]) {
    stops.push(initPageJumps(document, window));
    document.body.insertAdjacentHTML('beforeend', markup);
  }
  stops.push(initPageJumps(document, window));
  expect(listener).not.toHaveBeenCalled();
  expect(document.querySelector('[data-page-edge="top"]')!.hasAttribute('hidden')).toBe(false);
});

it('accumulates actual user travel, ignores resize/layout, and suppresses reached directions', () => {
  const f = page();
  stops.push(initPageJumps(document, window));
  f.move(500);
  expect(f.hidden()).toEqual([true, true]);
  window.dispatchEvent(new Event('wheel'));
  f.move(540);
  expect(f.hidden()).toEqual([true, true]);
  window.dispatchEvent(new Event('touchmove'));
  f.move(600);
  window.dispatchEvent(new Event('resize'));
  f.move(700);
  expect(f.hidden()).toEqual([true, true]);
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  f.move(760);
  expect(f.hidden()).toEqual([false, false]);
  f.move(1200);
  expect(f.hidden()).toEqual([false, true]);
  f.move(0);
  expect(f.hidden()).toEqual([true, false]);
  f.height.mockReturnValue(800);
  window.dispatchEvent(new Event('resize'));
  expect(f.hidden()).toEqual([true, true]);
});

it('uses a smaller gesture threshold on short viewports and restores existing footer focus metadata', () => {
  const f = page();
  const footer = document.querySelector('footer')!;
  footer.setAttribute('tabindex', '0');
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(320);
  const stop = initPageJumps(document, window);
  stops.push(stop);
  window.dispatchEvent(new Event('wheel'));
  f.move(80);
  expect(f.hidden()).toEqual([false, false]);
  stop();
  expect(footer.getAttribute('tabindex')).toBe('0');
  expect(f.hidden()).toEqual([true, true]);
});

it('qualifies a short scrollable page at its actual bottom while ignoring trivial overflow', () => {
  const f = page();
  f.height.mockReturnValue(890);
  stops.push(initPageJumps(document, window));
  window.dispatchEvent(new Event('wheel'));
  f.move(90);
  expect(f.hidden()).toEqual([false, true]);
  f.up.click();
  window.dispatchEvent(new Event('scroll'));
  expect(f.hidden()).toEqual([true, false]);
  f.height.mockReturnValue(830);
  for (const top of [30, 0, 30]) f.move(top);
  expect(f.hidden()).toEqual([true, true]);
});

it('moves and focuses actual page edges, rejects hidden/locked controls, and fully cleans up', () => {
  const f = page();
  const scroll = vi.spyOn(window, 'scrollTo');
  const stop = initPageJumps(document, window);
  stops.push(stop);
  f.down.click();
  expect(scroll).not.toHaveBeenCalled();
  window.dispatchEvent(new Event('wheel'));
  f.move(400);
  document.body.insertAdjacentHTML('beforeend', '<dialog open></dialog>');
  const beforeLocked = scroll.mock.calls.length;
  f.down.click();
  expect(scroll).toHaveBeenCalledTimes(beforeLocked);
  window.dispatchEvent(new Event('scroll'));
  expect(f.hidden()).toEqual([true, true]);
  document.querySelector('dialog')!.remove();
  window.dispatchEvent(new Event('scroll'));
  f.down.click();
  expect(scroll).toHaveBeenLastCalledWith({ top: 1200, behavior: 'instant' });
  expect(document.activeElement).toBe(document.querySelector('footer'));
  window.dispatchEvent(new Event('scroll'));
  expect(f.hidden()).toEqual([false, true]);
  f.up.click();
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  expect(document.activeElement).toBe(document.querySelector('main'));
  window.dispatchEvent(new Event('scroll'));
  expect(f.hidden()).toEqual([true, false]);
  stop();
  expect(document.querySelector('footer')!.hasAttribute('tabindex')).toBe(false);
  const beforeStop = scroll.mock.calls.length;
  f.down.click();
  f.up.click();
  window.dispatchEvent(new Event('wheel'));
  window.dispatchEvent(new Event('scroll'));
  expect(scroll).toHaveBeenCalledTimes(beforeStop);
  expect(f.hidden()).toEqual([true, true]);
});
