/**
 * Purpose: Protect timeline history-entry ownership and native return behavior.
 * Scope: Pre-navigation snapshots, restoration validation, entry metadata, fallback links, and cleanup.
 * Does NOT belong: Browser layout assertions or persistent navigation storage.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPagePosition, prepareTimelineRestore } from '../../src/lib/page-position';
const stops: (() => void)[] = [];
beforeEach(() => {
  document.body.innerHTML = '';
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  vi.restoreAllMocks();
});
describe('returning to the timeline', () => {
  function positionContext(history: object) {
    const events = new EventTarget();
    const win = {
      history,
      scrollY: 500,
      location: { origin: 'https://daysforth.com' },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    } as unknown as Parameters<typeof initPagePosition>[1];
    return { events, win };
  }
  it('claims the timeline entry before departure and snapshots the latest position for native traversal', () => {
    document.body.innerHTML = '<section data-timeline><a href="/posts/born/">Born</a></section>';
    const history = {
      state: { index: 2, scrollY: 90 },
      scrollRestoration: 'auto',
      replaceState: vi.fn(),
    };
    const { events, win } = positionContext(history);
    const navigation: NonNullable<typeof win.navigation> = Object.assign(new EventTarget(), {
      currentEntry: { index: 2, getState: () => ({ unrelated: 'preserved' }) },
      entries: () => [],
      updateCurrentEntry: vi.fn(),
    });
    win.navigation = navigation;
    const depart = (kind: NavigationType) => {
      const event = new Event('navigate');
      Object.defineProperty(event, 'navigationType', { value: kind });
      navigation.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    };
    const stop = initPagePosition(document, win);
    stops.push(stop);
    expect(history.scrollRestoration).toBe('manual');
    expect(history.replaceState).not.toHaveBeenCalled();
    document.querySelector('a')!.click();
    expect(history.replaceState).toHaveBeenLastCalledWith({ index: 2, scrollY: 500 }, '');
    Object.defineProperty(win, 'scrollY', { value: 740, configurable: true });
    depart('replace');
    expect(navigation.updateCurrentEntry).not.toHaveBeenCalled();
    for (const kind of ['traverse', 'reload', 'push'] as const) depart(kind);
    expect(navigation.updateCurrentEntry).toHaveBeenCalledTimes(3);
    expect(navigation.updateCurrentEntry).toHaveBeenLastCalledWith({
      state: { unrelated: 'preserved', scrollY: 740 },
    });
    events.dispatchEvent(new Event('pagehide'));
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    navigation.currentEntry = null;
    depart('traverse');
    expect(navigation.updateCurrentEntry).toHaveBeenLastCalledWith({ state: { scrollY: 740 } });
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    const recorded = history.replaceState.mock.calls.length;
    stop();
    depart('traverse');
    expect(navigation.updateCurrentEntry).toHaveBeenCalledTimes(4);
    events.dispatchEvent(new Event('pagehide'));
    document.querySelector('a')!.click();
    expect(history.replaceState).toHaveBeenCalledTimes(recorded);
    expect(history.scrollRestoration).toBe('manual');
  });
  it('keeps the explicit-click snapshot fallback without departure writes when Navigation API is absent', () => {
    document.body.innerHTML = '<main data-timeline><a href="/posts/born/">Born</a></main>';
    const history = { state: null, scrollRestoration: 'auto', replaceState: vi.fn() };
    const { events, win } = positionContext(history);
    stops.push(initPagePosition(document, win));
    document.querySelector('a')!.click();
    expect(history.replaceState).toHaveBeenCalledExactlyOnceWith({ scrollY: 500 }, '');
    events.dispatchEvent(new Event('pagehide'));
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    expect(history.scrollRestoration).toBe('manual');
  });
  it('prefers validated native entry state over an older explicit-click snapshot', () => {
    const { win } = positionContext({ state: { scrollY: 90 }, scrollRestoration: 'auto' });
    const getState = vi.fn<() => Record<string, unknown> | undefined>(() => ({ scrollY: 740 }));
    win.navigation = {
      currentEntry: { index: 0, getState },
    } as NonNullable<typeof win.navigation>;
    expect(prepareTimelineRestore(win)).toBe(740);
    getState.mockReturnValue(undefined);
    expect(prepareTimelineRestore(win)).toBe(90);
    for (const scrollY of [NaN, Infinity, -1, '740']) {
      getState.mockReturnValue({ scrollY });
      expect(prepareTimelineRestore(win)).toBeNull();
    }
    win.navigation.currentEntry = null;
    expect(prepareTimelineRestore(win)).toBe(90);
  });
  it('gives valid recorded positions exclusive restoration ownership, including the top', () => {
    const history = { state: null as unknown, scrollRestoration: 'auto' };
    const win = { history } as Pick<Window, 'history'>;
    expect(prepareTimelineRestore(win)).toBeNull();
    for (const position of ['500', NaN, Infinity, -1]) {
      history.state = { scrollY: position };
      expect(prepareTimelineRestore(win)).toBeNull();
      expect(history.scrollRestoration).toBe('auto');
    }
    for (const position of [500, 0]) {
      history.state = { scrollY: position };
      expect(prepareTimelineRestore(win)).toBe(position);
      expect(history.scrollRestoration).toBe('manual');
    }
  });
  it('uses same-origin native entries when the strict referrer policy hides the prior URL', () => {
    document.body.innerHTML =
      '<a href="https://daysforth.com/?date=2022-05" data-return-timeline>Back</a>';
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    const entries = [
      { index: 0, url: 'https://daysforth.com/?date=2022-05' },
      { index: 1, url: 'https://daysforth.com/posts/born/' },
    ];
    const win = {
      navigation: { currentEntry: { index: 1 }, entries: () => entries },
      history: { length: 2, back: vi.fn(), replaceState: vi.fn() },
      scrollY: 500,
      location: { origin: 'https://daysforth.com' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Parameters<typeof initPagePosition>[1];
    stops.push(initPagePosition(document, win));
    const link = document.querySelector('a')!;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
    win.navigation!.currentEntry!.index = 4;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
    win.navigation!.currentEntry = null;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
  });
  it('uses native back when a post came from the timeline and records only browser-history scroll state', () => {
    document.body.innerHTML =
      '<a href="https://daysforth.com/?date=2018-05" data-return-timeline><span>Back</span></a><button>Other</button>';
    Object.defineProperty(document, 'referrer', {
      value: 'https://daysforth.com/?date=2018-05',
      configurable: true,
    });
    const history = {
      state: { index: 2 },
      length: 2,
      back: vi.fn(),
      replaceState: vi.fn(),
      scrollRestoration: 'auto',
    };
    const { events, win } = positionContext(history);
    const stop = initPagePosition(document, win);
    stops.push(stop);
    document.querySelector('span')!.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    const beforePagehide = history.replaceState.mock.calls.length;
    events.dispatchEvent(new Event('pagehide'));
    expect(history.replaceState).toHaveBeenCalledTimes(beforePagehide);
    expect(history.scrollRestoration).toBe('auto');
    expect(history.replaceState).toHaveBeenCalledWith({ index: 2, scrollY: 500 }, '');
    const link = document.querySelector('a')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, altKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }));
    document.dispatchEvent(new MouseEvent('click'));
    document.querySelector('button')!.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'referrer', {
      value: 'https://other.example.com/',
      configurable: true,
    });
    link.click();
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    link.click();
    Object.defineProperty(document, 'referrer', {
      value: 'https://daysforth.com/life/',
      configurable: true,
    });
    link.click();
    history.length = 1;
    link.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    document.querySelector('button')!.setAttribute('data-history', 'back');
    document.querySelector('button')!.click();
    const recorded = history.replaceState.mock.calls.length;
    stop();
    link.click();
    expect(history.replaceState).toHaveBeenCalledTimes(recorded);
  });
});
