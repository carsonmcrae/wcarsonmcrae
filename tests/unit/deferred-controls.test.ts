/**
 * Purpose: Verify that optional controls load once without swallowing the first interaction.
 * Scope: Buffered clicks, settings requests, touch gestures, failure fallback, and disposal.
 * Does NOT belong: The loaded dialog behavior or network fetching.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { deferControl } from '../../src/lib/deferred-controls';
import { disposeDocument } from './helpers';
const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));
function pending() {
  let resolve!: (stop: () => void) => void;
  let reject!: () => void;
  const load = vi.fn(
    () =>
      new Promise<() => void>((yes, no) => {
        resolve = yes;
        reject = no;
      }),
  );
  return { load, resolve: (stop: () => void) => resolve(stop), reject: () => reject() };
}
it('buffers primary clicks and explicit requests, ignoring modified clicks and unrelated targets', async () => {
  document.body.innerHTML = '<button data-open><span>Open</span></button><a href="/">Elsewhere</a>';
  const task = pending();
  const stop = deferControl(document, '[data-open]', task.load, { request: 'settings' });
  stops.push(stop);
  const button = document.querySelector('button')!;
  const child = document.querySelector('span')!;
  const clicked = vi.fn();
  const requested = vi.fn();
  for (const options of [
    { button: 1 },
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
  ])
    child.dispatchEvent(new MouseEvent('click', { bubbles: true, ...options }));
  document.dispatchEvent(new MouseEvent('click'));
  document.dispatchEvent(new Event('click'));
  document.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(task.load).not.toHaveBeenCalled();
  child.click();
  document.dispatchEvent(new CustomEvent('settings'));
  expect(task.load).toHaveBeenCalledTimes(1);
  button.addEventListener('click', clicked);
  document.addEventListener('settings', requested, { once: true });
  const cleanup = vi.fn();
  task.resolve(cleanup);
  await Promise.resolve();
  expect(clicked).toHaveBeenCalledTimes(1);
  expect(requested).toHaveBeenCalledTimes(1);
  stop();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
it('disposes pending loads and falls back to native controls after a load failure', async () => {
  document.body.innerHTML = '<button data-open>Open</button>';
  const button = document.querySelector('button')!;
  const first = pending();
  const activate = vi.fn();
  const stop = deferControl(document, '[data-open]', first.load, { activate });
  button.click();
  stop();
  const cleanup = vi.fn();
  first.resolve(cleanup);
  await Promise.resolve();
  expect(cleanup).toHaveBeenCalledOnce();
  expect(activate).not.toHaveBeenCalled();
  const second = pending();
  document.documentElement.classList.add('js');
  stops.push(deferControl(document, '[data-open]', second.load));
  button.click();
  second.reject();
  await Promise.resolve();
  await Promise.resolve();
  expect(document.documentElement.classList.contains('js')).toBe(false);
});

it('activates the original detached control directly without replaying a global click into newer navigation', async () => {
  document.body.innerHTML =
    '<article><button data-command aria-pressed="false"><span>Save</span></button></article><button id="menu">Open category</button>';
  const task = pending();
  const command = document.querySelector<HTMLButtonElement>('[data-command]')!;
  const activation = vi.fn((control: HTMLElement) => control.setAttribute('aria-pressed', 'true'));
  stops.push(deferControl(document, '[data-command]', task.load, { activate: activation }));
  const documentClicks = vi.fn();
  document.addEventListener('click', documentClicks);
  command.querySelector('span')!.click();
  document.querySelector<HTMLButtonElement>('#menu')!.click();
  document.querySelector('article')!.remove();
  document.body.insertAdjacentHTML(
    'beforeend',
    '<button data-command aria-pressed="false">Replacement</button>',
  );
  task.resolve(vi.fn());
  await Promise.resolve();
  expect(activation).toHaveBeenCalledExactlyOnceWith(command);
  expect(command.isConnected).toBe(false);
  expect(command.getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('[data-command]')!.getAttribute('aria-pressed')).toBe('false');
  expect(documentClicks).toHaveBeenCalledTimes(2);
  document.removeEventListener('click', documentClicks);
});
it('buffers an edge gesture but leaves reserved browser edges and form controls alone', async () => {
  document.body.innerHTML = '<span>Edge</span><button>Button</button>';
  const task = pending();
  stops.push(deferControl(document, '[data-open]', task.load, { edge: true }));
  const area = document.querySelector('span')!;
  const touch = (type: string, x?: number, target: EventTarget = area) =>
    target.dispatchEvent(
      new TouchEvent(type, {
        bubbles: true,
        touches: x === undefined ? [] : [{ clientX: x } as Touch],
      }),
    );
  touch('touchend');
  document.dispatchEvent(new Event('click'));
  touch('touchstart');
  touch('touchstart', 12);
  touch('touchstart', 55);
  touch('touchstart', 30, document.querySelector('button')!);
  expect(task.load).not.toHaveBeenCalled();
  touch('touchstart', 30, document);
  touch('touchend', 120, document);
  const replay = vi.fn();
  document.addEventListener('touchend', replay, { once: true });
  task.resolve(vi.fn());
  await Promise.resolve();
  expect(replay).toHaveBeenCalledOnce();
  expect(task.load).toHaveBeenCalledOnce();
});
