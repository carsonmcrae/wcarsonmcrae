/**
 * Purpose: Preserve active card interactions while deferred timeline commands adopt static groups.
 * Scope: Focus and node continuity, semantic period metadata, observed months, and later commands.
 * Does NOT belong: Browser timing, weakened readiness assertions, or duplicated timeline algorithms.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initTimeline } from '../../src/lib/timeline-controller';
import { disposeDocument } from './helpers';
import { timelineLoadingFixture, setReadingMonth } from './timeline-loading-fixture';

const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));

it('adopts the existing monthly feed without detaching a focused or touch-revealed card', () => {
  const f = timelineLoadingFixture('', 300);
  setReadingMonth(f, '2022-05');
  const card = document.querySelector<HTMLElement>('#moment-vanderbilt-graduation')!;
  const parent = card.parentElement;
  const year = card.closest('.moment-group--year');
  const link = card.querySelector<HTMLAnchorElement>('h3 a')!;
  card.dataset['mediaRevealed'] = 'true';
  link.focus();
  const controller = initTimeline(document, f.win, { preservePosition: true })!;
  stops.push(controller.destroy);
  expect(document.activeElement).toBe(link);
  expect(card.parentElement).toBe(parent);
  expect(card.closest('.moment-group--year')).toBe(year);
  expect(card.dataset['mediaRevealed']).toBe('true');
  expect(f.win.scrollTo).not.toHaveBeenCalled();
  expect(controller.getState().date).toBe('2022-05');
  expect(document.querySelector('[data-current-date]')!.textContent).toBe('May 2022');
});

it('observes adopted months and retains the normal explicit command rendering lifecycle', () => {
  const f = timelineLoadingFixture();
  const months = [
    ...f.container.querySelectorAll<HTMLElement>('.moment-group--year .moment-group'),
  ];
  const observed: Element[] = [];
  let notify!: IntersectionObserverCallback;
  const disconnect = vi.fn();
  class Observer {
    constructor(callback: IntersectionObserverCallback) {
      notify = callback;
    }
    observe(target: Element) {
      observed.push(target);
    }
    disconnect = disconnect;
  }
  Object.defineProperty(f.win, 'IntersectionObserver', { value: Observer });
  const controller = initTimeline(document, f.win, { preservePosition: true })!;
  stops.push(controller.destroy);
  expect(observed).toEqual(months);
  for (const month of months) {
    const date = month.querySelector('time')!.dateTime.slice(0, 7);
    expect(month.dataset['period']).toBe(date);
    expect(month.dataset['periodDate']).toBe(date);
  }
  const reading = months.find((month) => month.dataset['period'] === '2022-05')!;
  notify(
    [{ target: reading, isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
  expect(controller.getState().date).toBe('2022-05');
  controller.goToDate('2026-11');
  expect(f.scrolling.mock.instances.at(-1)).toBe(document.querySelector('[data-timeline]'));
  document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
  expect(controller.getState().view).toBe('posts');
  expect(f.container.querySelector('.moment-group--year')).toBeNull();
  expect(f.container.querySelectorAll('.post-card')).toHaveLength(f.cards.length);
  expect(disconnect).toHaveBeenCalled();
});

it('keeps a missing SSR presentation a contract failure rather than silently losing period navigation', () => {
  const f = timelineLoadingFixture();
  f.container.replaceChildren(...f.cards);
  expect(() => initTimeline(document, f.win, { preservePosition: true })).toThrow(
    'Missing server-rendered monthly timeline groups',
  );
});
