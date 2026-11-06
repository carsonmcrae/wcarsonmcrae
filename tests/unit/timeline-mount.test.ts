/**
 * Purpose: Preserve timeline commands while isolating optional rail loading and shortcut lifecycle.
 * Scope: Genuine gesture handoff, responsive eligibility, asynchronous failure/disposal, and cleanup.
 * Does NOT belong: Production requests, duplicated timeline algorithms, or browser timing claims.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { mountInteractiveTimeline } from '../../src/lib/timeline-mount';
import type * as MomentNavigation from '../../src/lib/moment-navigator';
import { disposeDocument } from './helpers';
import { timelineLoadingFixture, attachTimelineGeometry } from './timeline-loading-fixture';

type Navigation = typeof MomentNavigation;
const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));

function controlledMedia(matches: boolean) {
  const query = window.matchMedia('(min-width: 70rem)');
  let current = matches;
  vi.spyOn(query, 'matches', 'get').mockImplementation(() => current);
  return Object.assign(query, {
    change(next: boolean) {
      current = next;
      query.dispatchEvent(new MediaQueryListEvent('change', { matches: next, media: query.media }));
    },
  });
}

function fixture() {
  const f = timelineLoadingFixture('', 300);
  return { ...f, ...attachTimelineGeometry(f) };
}

it('hands a genuine first gesture to useful shortcuts and removes both shortcuts and commands on cleanup', () => {
  const f = fixture();
  const mounted = mountInteractiveTimeline(document, f.win, { user: true, delta: 300 }, null, true);
  stops.push(mounted.destroy);
  expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
  document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
  expect(mounted.getState().view).toBe('posts');
  mounted.destroy();
  expect([f.up.hidden, f.down.hidden]).toEqual([true, true]);
  document.querySelector<HTMLButtonElement>('button[data-view="timeline"]')!.click();
  expect(mounted.getState().view).toBe('posts');
});

it('does not turn programmatic restoration into a qualified scrolling gesture', () => {
  const f = fixture();
  const mounted = mountInteractiveTimeline(
    document,
    f.win,
    { user: false, delta: 300 },
    null,
    false,
  );
  stops.push(mounted.destroy);
  expect([f.up.hidden, f.down.hidden]).toEqual([true, true]);
});

it('waits for desktop eligibility and mounts a prefetched rail only once after a real responsive change', async () => {
  const f = fixture();
  const desktop = controlledMedia(false);
  const cleanup = vi.fn();
  const initialize = vi.fn(() => cleanup);
  const navigation = Promise.resolve({ initMomentNavigator: initialize });
  const mounted = mountInteractiveTimeline(
    document,
    f.win,
    { user: false, delta: 0 },
    desktop,
    true,
    navigation,
  );
  stops.push(mounted.destroy);
  await navigation;
  expect(initialize).not.toHaveBeenCalled();
  desktop.change(true);
  await vi.waitFor(() => expect(initialize).toHaveBeenCalledOnce());
  desktop.change(false);
  desktop.change(true);
  expect(initialize).toHaveBeenCalledOnce();
  mounted.destroy();
  expect(cleanup).toHaveBeenCalledOnce();
});

it.each(['resolve', 'reject'] as const)(
  'discards an optional rail that can %s only after disposal',
  async (outcome) => {
    const f = fixture();
    const desktop = controlledMedia(true);
    const task = Promise.withResolvers<Navigation | null>();
    const initialize = vi.fn(() => vi.fn());
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mounted = mountInteractiveTimeline(
      document,
      f.win,
      { user: false, delta: 0 },
      desktop,
      true,
      task.promise,
    );
    mounted.destroy();
    if (outcome === 'resolve') task.resolve({ initMomentNavigator: initialize });
    else task.reject(new Error('private URL'));
    await task.promise.catch(() => {});
    expect(initialize).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  },
);

it.each(['load', 'initialization'] as const)(
  'isolates an optional rail %s failure while retaining core commands and shortcuts',
  async (category) => {
    const f = fixture();
    const desktop = controlledMedia(true);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const navigation =
      category === 'load'
        ? Promise.reject<Navigation>(new Error('private request URL'))
        : Promise.resolve({
            initMomentNavigator: () => {
              throw new Error('private configuration');
            },
          });
    const mounted = mountInteractiveTimeline(
      document,
      f.win,
      { user: true, delta: 300 },
      desktop,
      true,
      navigation,
    );
    stops.push(mounted.destroy);
    await vi.waitFor(() => expect(warning).toHaveBeenCalled());
    expect(warning.mock.calls[0]![1]).toMatchObject({ component: 'timeline', category });
    document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
    expect(mounted.getState().view).toBe('posts');
    expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
  },
);

it('accepts a failed prefetch result without trying to mount an absent module', async () => {
  const f = fixture();
  const desktop = controlledMedia(true);
  const mounted = mountInteractiveTimeline(
    document,
    f.win,
    { user: false, delta: 0 },
    desktop,
    true,
    Promise.resolve(null),
  );
  stops.push(mounted.destroy);
  await Promise.resolve();
  expect(mounted.getState().view).toBe('timeline');
});

it('can load the actual optional rail through its own native import when no prefetch was supplied', async () => {
  const f = fixture();
  const desktop = controlledMedia(true);
  const mounted = mountInteractiveTimeline(
    document,
    f.win,
    { user: false, delta: 0 },
    desktop,
    true,
  );
  stops.push(mounted.destroy);
  await vi.dynamicImportSettled();
  expect(mounted.getState().view).toBe('timeline');
});
