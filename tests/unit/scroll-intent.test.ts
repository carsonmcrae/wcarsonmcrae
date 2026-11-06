/**
 * Purpose: Verify actual page gestures are distinguished from layout and locked-dialog movement.
 * Scope: Shared input classification, delta tracking, resize, gesture completion, and cleanup.
 * Does NOT belong: Page/feed geometry or native browser animation pixels.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { isScrollLocked, observeUserScroll } from '../../src/lib/scroll-intent';
import { disposeDocument } from './helpers';
const stops: (() => void)[] = [];
afterEach(() => {
  delete document.documentElement.dataset['menuOpen'];
  window.scrollTo(0, 0);
  disposeDocument(stops);
});

it('tracks only current gestures, resets on completion/resize, and removes every listener', () => {
  const changed = vi.fn();
  const intent = observeUserScroll(document, window, changed);
  stops.push(intent.destroy);
  const move = (top: number) => {
    window.scrollTo(0, top);
    window.dispatchEvent(new Event('scroll'));
  };
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 0 });
  move(500);
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 500 });
  window.dispatchEvent(new Event('wheel'));
  move(530);
  expect(changed).toHaveBeenLastCalledWith({ user: true, delta: 30 });
  window.dispatchEvent(new Event('scrollend'));
  move(550);
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 20 });
  window.dispatchEvent(new Event('touchmove'));
  move(570);
  expect(changed).toHaveBeenLastCalledWith({ user: true, delta: 20 });
  window.scrollTo(0, 600);
  window.dispatchEvent(new Event('resize'));
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 30 });
  const calls = changed.mock.calls.length;
  intent.destroy();
  window.dispatchEvent(new Event('wheel'));
  window.dispatchEvent(new Event('touchmove'));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
  window.dispatchEvent(new PointerEvent('pointerdown'));
  window.dispatchEvent(new Event('resize'));
  move(650);
  expect(changed).toHaveBeenCalledTimes(calls);
});

it('ignores control keyboard input while retaining real wheel/touch scrolling over controls', () => {
  document.body.innerHTML = '<input><button>Control</button><p>Text</p>';
  const changed = vi.fn();
  const intent = observeUserScroll(document, window, changed);
  stops.push(intent.destroy);
  for (const target of [document.querySelector('input')!, document.querySelector('button')!]) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    intent.refresh();
    expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 0 });
  }
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 0 });
  document
    .querySelector('p')!
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: true, delta: 0 });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: true, delta: 0 });
  for (const type of ['wheel', 'touchmove']) {
    window.dispatchEvent(new Event('scrollend'));
    document.querySelector('input')!.dispatchEvent(new Event(type, { bubbles: true }));
    intent.refresh();
    expect(changed).toHaveBeenLastCalledWith({ user: true, delta: 0 });
  }
});

it('recognizes only the native scrollbar edge and rejects gestures while a dialog or drawer locks the page', () => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(500);
  const changed = vi.fn();
  const intent = observeUserScroll(document, window, changed);
  stops.push(intent.destroy);
  for (const [target, clientX, expected] of [
    [document.body, 520, false],
    [document.documentElement, 450, false],
    [document.documentElement, 520, true],
  ] as const) {
    target.dispatchEvent(new PointerEvent('pointerdown', { clientX, bubbles: true }));
    intent.refresh();
    expect(changed).toHaveBeenLastCalledWith({ user: expected, delta: 0 });
  }
  expect(isScrollLocked(document)).toBe(false);
  document.body.innerHTML = '<dialog open></dialog>';
  expect(isScrollLocked(document)).toBe(true);
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 0 });
  document.body.innerHTML = '';
  document.documentElement.dataset['menuOpen'] = 'true';
  expect(isScrollLocked(document)).toBe(true);
  window.dispatchEvent(new Event('wheel'));
  window.dispatchEvent(new Event('touchmove'));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
  document.documentElement.dispatchEvent(
    new PointerEvent('pointerdown', { clientX: 520, bubbles: true }),
  );
  intent.refresh();
  expect(changed).toHaveBeenLastCalledWith({ user: false, delta: 0 });
});
