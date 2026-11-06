/**
 * Purpose: Protect the temporary timeline hold without hiding content after restoration or failure.
 * Scope: Pre-paint capability detection and idempotent release of native inert and the restore marker.
 * Does NOT belong: Browser focus, accessibility-tree exposure, or history-position algorithms.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { releaseTimelineRestore, TIMELINE_HOLD_SCRIPT } from '../../src/lib/page-position';

beforeEach(() => {
  document.body.innerHTML = '<main><script></script><a href="/">Read</a></main>';
  vi.spyOn(document, 'currentScript', 'get').mockReturnValue(document.querySelector('script'));
});
afterEach(() => {
  releaseTimelineRestore(document);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const run = () => new Function(TIMELINE_HOLD_SCRIPT)();

it('leaves ordinary static reading interactive when there is no restore hold', () => {
  run();
  expect(document.querySelector('main')!.inert).toBe(false);
});

it('holds only a restoring main and releases both mechanisms without disturbing unrelated attributes', () => {
  document.documentElement.dataset['timelineRestore'] = '';
  const main = document.querySelector('main')!;
  main.setAttribute('tabindex', '-1');
  run();
  expect(main.inert).toBe(true);
  releaseTimelineRestore(document);
  expect(main.inert).toBe(false);
  expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(false);
  expect(main.getAttribute('tabindex')).toBe('-1');
  releaseTimelineRestore(document);
});

it('keeps the CSS visibility fallback when native inert is unavailable', () => {
  document.documentElement.dataset['timelineRestore'] = '';
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'inert')!;
  Reflect.deleteProperty(HTMLElement.prototype, 'inert');
  try {
    run();
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(true);
  } finally {
    Object.defineProperty(HTMLElement.prototype, 'inert', descriptor);
  }
});
