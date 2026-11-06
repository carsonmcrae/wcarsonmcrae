/**
 * Purpose: Supply unmounted server-like monthly timeline markup for deferred lifecycle tests.
 * Scope: Annual wrappers, original monthly cards, isolated platform state, and optional viewport geometry.
 * Does NOT belong: Alternate domain rules, production loaders, or browser performance measurements.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { vi } from 'vitest';
import { timelineFixture } from './timeline-fixture';

export function timelineLoadingFixture(search = '', position?: number) {
  const f = timelineFixture('', false, position);
  f.controller.destroy();
  f.scrolling.mockClear();
  f.setUrl(search);
  Object.defineProperty(f.win, 'scrollY', { value: position ?? 0, configurable: true });
  const container = document.querySelector<HTMLElement>('[data-timeline-groups]')!;
  const cards = Array.from(container.querySelectorAll<HTMLElement>('.post-card'));
  const years = new Map<string, HTMLElement>();
  for (const month of [...container.children] as HTMLElement[]) {
    const year = month.dataset['periodDate']!.slice(0, 4);
    month.removeAttribute('data-period');
    month.removeAttribute('data-period-date');
    let body = years.get(year);
    if (!body) {
      const section = document.createElement('section');
      section.className = 'moment-group moment-group--year';
      section.innerHTML = `<h2>${year}</h2><div></div>`;
      body = section.querySelector<HTMLElement>('div')!;
      years.set(year, body);
      container.append(section);
    }
    body.append(month);
  }
  const root = document.querySelector<HTMLElement>('[data-timeline]')!;
  const dock = document.createElement('div');
  dock.className = 'timeline-dock';
  dock.append(document.body.firstElementChild!);
  dock.append(
    ...[...root.children].filter((element) =>
      element.matches('div:not([data-timeline-empty],[data-timeline-groups]),details'),
    ),
  );
  root.prepend(dock);
  return { ...f, win: f.win as unknown as Window, cards, container };
}

export function attachTimelineGeometry(f: ReturnType<typeof timelineLoadingFixture>) {
  const header = document.createElement('header');
  header.className = 'site-header';
  document.body.prepend(header);
  const root = document.querySelector<HTMLElement>('[data-timeline]')!;
  const dock = root.querySelector<HTMLElement>('.timeline-dock')!;
  dock.insertAdjacentHTML(
    'beforeend',
    '<div><button data-timeline-edge="newest" hidden></button></div>',
  );
  root.insertAdjacentHTML(
    'afterend',
    '<div><button data-timeline-edge="oldest" hidden></button></div>',
  );
  const rects = new Map<Element, Partial<DOMRect>>([
    [header, { top: 0, bottom: 56 }],
    [dock, { top: 56, bottom: 250 }],
    [root, { top: 50, bottom: 2400 }],
    [root.querySelector('[data-timeline-groups]')!, { top: 100, bottom: 2400, height: 2300 }],
  ]);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return { top: 0, bottom: 0, height: 0, ...rects.get(this) } as DOMRect;
  });
  Object.defineProperty(f.win, 'innerHeight', { value: 800 });
  return {
    up: document.querySelector<HTMLButtonElement>('[data-timeline-edge="newest"]')!,
    down: document.querySelector<HTMLButtonElement>('[data-timeline-edge="oldest"]')!,
  };
}

export function setReadingMonth(f: ReturnType<typeof timelineLoadingFixture>, date: string) {
  Object.defineProperty(f.win, 'innerHeight', { value: 800, configurable: true });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.matches('.moment-group')) return new DOMRect();
    const month = this.dataset['periodDate'];
    if (month === date) return new DOMRect(0, 290, 400, 120);
    if (month === '2026-10') return new DOMRect(0, 100, 400, 100);
    return new DOMRect(0, 1000, 400, 100);
  });
}
