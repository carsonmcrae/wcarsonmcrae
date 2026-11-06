/**
 * Purpose: Behavioral tests for the interactive Daysforth timeline.
 * Scope: Presentation and category state, empty months, clusters, jump focus, rail input, history, and cleanup.
 * Does NOT belong: Visual layout or real-browser accessibility checks.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initTimeline } from '../../src/lib/timeline-controller';
import { monthIndex } from '../../src/lib/timeline-dates';
import { timelineFixture } from './timeline-fixture';
const cleanups: (() => void)[] = [];
function setup(search = '', observe = false) {
  const fixture = timelineFixture(search, observe);
  cleanups.push(fixture.controller.destroy);
  return fixture;
}
function appendJumpLink(id: string) {
  const target = document.getElementById(`moment-${id}`)!;
  const link = document.createElement('a');
  link.href = `#moment-${id}`;
  Object.assign(link.dataset, {
    jumpDate: target.querySelector('time')!.dateTime,
    jumpMoment: id,
  });
  const label = document.createElement('span');
  label.textContent = 'Open moment';
  link.append(label);
  document.body.append(link);
  return { link, label, target };
}
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
describe('timeline interaction', () => {
  it('delegates exact same-month card jumps without adding another history owner', () => {
    const { controller, history, change, scrolling } = setup();
    change('detail', 'years');
    const { target, link } = appendJumpLink('married-nicole');
    const before = history.pushState.mock.calls.length;
    link.click();
    expect(document.activeElement).toBe(target.querySelector('h3 a'));
    expect(scrolling.mock.instances.at(-1)).toBe(target);
    expect(target.closest('details')!.open).toBe(true);
    expect(history.pushState).toHaveBeenCalledTimes(before + 1);
    expect(controller.getState().date).toBe('2026-10');
  });
  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { button: 2 },
  ])('preserves a native navigator link for modified/non-primary input: %j', (options) => {
    const { controller, history, scrolling } = setup();
    const before = controller.getState();
    const { label } = appendJumpLink('born');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
    label.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(controller.getState()).toEqual(before);
    expect(history.pushState).not.toHaveBeenCalled();
    expect(scrolling).not.toHaveBeenCalled();
  });
  it('enhances an ordinary navigator link once through its original nested target', () => {
    const { controller, history, scrolling } = setup();
    const { label, target } = appendJumpLink('born');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    label.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(controller.getState().date).toBe('1999-11');
    expect(history.pushState).toHaveBeenCalledOnce();
    expect(scrolling.mock.instances.at(-1)).toBe(target);
    expect(document.activeElement).toBe(target.querySelector('h3 a'));
  });
  it('uses the selected date heading when an optional card id belongs to another month', () => {
    const { controller, history, scrolling } = setup();
    controller.goToDate('2022-05', true, 'none', 'married-nicole');
    const heading = document.querySelector('[data-period="2022-05"] h2');
    expect(document.activeElement).toBe(heading);
    expect(scrolling.mock.instances.at(-1)).toBe(heading);
    expect(controller.getState().date).toBe('2022-05');
    expect(history.pushState).not.toHaveBeenCalled();
  });
  it('restores and updates the selected category glyph from the rendered option, preserving its base path', () => {
    const { change, setUrl, events } = setup('?category=Work');
    const selected = document.querySelector('[data-category-icon] use')!;
    expect(selected.getAttribute('href')).toBe('/icons.svg#icon-work');
    change('category', 'Projects');
    expect(selected.getAttribute('href')).toBe('/icons.svg#icon-portfolio');
    const life = document
      .querySelector('[name="category"][value="Life"]')!
      .closest('label')!
      .querySelector('use')!;
    life.setAttribute('href', '/wcarsonmcrae/icons.svg#icon-life');
    change('category', 'Life');
    expect(selected.getAttribute('href')).toBe('/wcarsonmcrae/icons.svg#icon-life');
    setUrl('?category=Saved');
    events.dispatchEvent(new Event('popstate'));
    expect(selected.getAttribute('href')).toBe('/icons.svg#icon-bookmark');
  });
  it('restores captured history positions instead of replacing them with a date jump', () => {
    const { controller, events, win, history, scrolling } = timelineFixture(
      '?date=2022-05',
      false,
      0,
    );
    cleanups.push(controller.destroy);
    expect(scrolling).not.toHaveBeenCalled();
    events.dispatchEvent(new Event('popstate'));
    expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    history.state = { scrollY: 4512 };
    events.dispatchEvent(new Event('popstate'));
    expect(win.scrollTo).toHaveBeenLastCalledWith({ top: 4512, behavior: 'instant' });
    controller.goToDate('1999-11');
    expect(history.pushState).toHaveBeenLastCalledWith({}, '', expect.any(URL));
  });
  it('preserves a native entry snapshot during initialization and gives it priority on traversal', () => {
    const { controller, win, history, scrolling, events } = timelineFixture('?date=2022-05');
    controller.destroy();
    scrolling.mockClear();
    Object.defineProperty(win, 'navigation', {
      value: { currentEntry: { getState: () => ({ scrollY: 740 }) } },
    });
    const restored = initTimeline(document, win)!;
    cleanups.push(restored.destroy);
    expect(scrolling).not.toHaveBeenCalled();
    history.state = { scrollY: 90 };
    events.dispatchEvent(new Event('popstate'));
    expect(win.scrollTo).toHaveBeenLastCalledWith({ top: 740, behavior: 'instant' });
    expect(scrolling).not.toHaveBeenCalled();
  });
  it('jumps to the visible collection boundaries, including filtered and empty collections', () => {
    const { controller, change } = setup();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button data-timeline-edge="newest" data-jump-date="2026-11">Newest</button><button data-timeline-edge="oldest" data-jump-date="1999-11">Oldest</button>',
    );
    change('category', 'Milestones');
    document.querySelector<HTMLButtonElement>('[data-timeline-edge="newest"]')!.click();
    expect(controller.getState().date).toBe('2026-10');
    document.querySelector<HTMLButtonElement>('[data-timeline-edge="oldest"]')!.click();
    expect(controller.getState().date).toBe('1999-11');
    change('category', 'Saved');
    document.querySelector<HTMLButtonElement>('[data-timeline-edge="newest"]')!.click();
    expect(controller.getState().date).toBe('2026-11');
  });
  it('filters live saved state, handles an empty collection, and refreshes after a bookmark changes', () => {
    const { controller, change, history } = setup();
    const born = document.querySelector<HTMLElement>('#moment-born')!;
    const save = document.createElement('button');
    save.dataset['save'] = '';
    save.setAttribute('aria-pressed', 'true');
    born.append(save);
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('.post-card')).toHaveLength(24);
    change('category', 'Saved');
    expect(document.querySelectorAll('.post-card')).toHaveLength(1);
    expect(document.querySelector('[data-timeline-status]')!.textContent).toBe(
      '1 moment. Timeline view. Saved.',
    );
    save.setAttribute('aria-pressed', 'false');
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('.post-card')).toHaveLength(0);
    expect(document.querySelector('[data-timeline-empty]')!.textContent).toBe(
      'No saved moments in this browser yet.',
    );
    controller.goToDate('2020-01');
    expect(document.activeElement).toBe(document.querySelector('[data-timeline-empty]'));
    const calls = history.pushState.mock.calls.length;
    controller.goToDate('2021-01', false, 'none');
    expect(history.pushState).toHaveBeenCalledTimes(calls);
    controller.goToDate('2022-01', false, 'replace');
    expect(history.replaceState).toHaveBeenCalled();
    save.setAttribute('aria-pressed', 'true');
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('.post-card')).toHaveLength(1);
    controller.destroy();
    save.setAttribute('aria-pressed', 'false');
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('.post-card')).toHaveLength(1);
  });
  it('leaves unrelated pages alone and progressively groups the full feed by month', () => {
    expect(initTimeline(document, window)).toBeNull();
    const { controller } = setup();
    expect(controller.getState()).toEqual({
      view: 'timeline',
      category: 'All',
      detail: 'months',
      date: '2026-11',
    });
    expect(document.querySelectorAll('.post-card')).toHaveLength(24);
    expect(document.querySelector('[data-timeline-status]')!.textContent).toContain('24 moments');
    expect(
      document.querySelector('[data-period="2026-10"]')!.querySelectorAll('article'),
    ).toHaveLength(3);
  });
  it('switches views using the existing card elements while preserving the selected date', () => {
    const { controller, history } = setup();
    const position = vi
      .spyOn(document.querySelector<HTMLElement>('[data-timeline]')!, 'getBoundingClientRect')
      .mockReturnValue({ top: -100 } as DOMRect);
    const card = document.querySelector('#moment-married-nicole');
    controller.goToDate('2026-10');
    document
      .querySelector<HTMLButtonElement>('[data-view="posts"]')!
      .querySelector('span')!
      .click();
    expect(controller.getState()).toMatchObject({
      view: 'posts',
      date: '2026-10',
      category: 'All',
    });
    expect(document.querySelector('#moment-married-nicole')).toBe(card);
    expect(document.querySelector('button[data-view="posts"]')!.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(history.pushState).toHaveBeenCalled();
    position.mockReturnValue({ top: 100 } as DOMRect);
    document.querySelector<HTMLButtonElement>('button[data-view="timeline"]')!.click();
    expect(controller.getState().view).toBe('timeline');
  });
  it('filters categories, retains milestones, and exposes the requested month’s empty state', () => {
    const { controller, change } = setup();
    change('category', 'Work');
    expect(document.querySelectorAll('.post-card')).toHaveLength(9);
    expect(document.querySelector('#moment-born')).not.toBeNull();
    expect(document.querySelector('[data-category-label]')!.textContent).toBe('Work');
    expect(document.querySelector('[data-timeline-empty]')!.textContent).toContain(
      'November 2026 for Work',
    );
    expect(controller.getState().date).toBe('2026-11');
    document.querySelector<HTMLAnchorElement>('[data-timeline-empty] a')!.click();
    expect(controller.getState().date).toBe('2026-10');
    expect(document.querySelector<HTMLElement>('[data-timeline-empty]')!.hidden).toBe(true);
    change('category', 'All');
    expect(document.querySelectorAll('.post-card')).toHaveLength(24);
  });
  it('gives a nearest-moment link the same native date destination as its enhanced command', () => {
    const { win } = setup('?view=posts&category=Work&detail=years&date=2020-01');
    const link = document.querySelector<HTMLAnchorElement>('[data-timeline-empty] a')!;
    const destination = new URL(link.getAttribute('href')!, win.location.href);
    expect(Object.fromEntries(destination.searchParams)).toEqual({
      view: 'posts',
      category: 'Work',
      detail: 'years',
      date: link.dataset['jumpDate']!.slice(0, 7),
    });
    expect(destination.hash).toMatch(/^#moment-/);
  });
  it('uses newly selected filters in nearest links before their history update completes', () => {
    const { change } = setup();
    const link = () => document.querySelector<HTMLAnchorElement>('[data-timeline-empty] a')!;
    change('category', 'Work');
    expect(new URL(link().href).searchParams.get('category')).toBe('Work');
    change('detail', 'years');
    expect(new URL(link().href).searchParams.get('detail')).toBe('years');
  });
  it('opens a date’s period cluster and keeps native disclosure summaries usable', () => {
    const { controller, change } = setup();
    change('detail', 'years');
    expect(document.activeElement).toBe(
      document.querySelector('[data-date-form]')!.closest('details')!.querySelector('summary'),
    );
    const cluster = document.querySelector<HTMLDetailsElement>('[data-period="2026"] details')!;
    expect(cluster.open).toBe(true);
    expect(cluster.querySelector('summary')!.textContent).toContain('7 moments');
    cluster.open = false;
    controller.goToDate('2026-10');
    expect(cluster.open).toBe(true);
    expect(document.activeElement?.tagName).toBe('H2');
    change('detail', 'quarters');
    expect(document.querySelector('[data-period="2026-Q4"]')).not.toBeNull();
  });
  it('uses pins and previews continuous slider values before committing a date jump', () => {
    const { controller } = setup();
    document.querySelector<HTMLButtonElement>('[data-jump-date="1999-11"]')!.click();
    expect(controller.getState().date).toBe('1999-11');
    const slider = document.querySelector<HTMLInputElement>('[data-date-slider]')!;
    slider.value = String(monthIndex('2022-05'));
    slider.dispatchEvent(new Event('input'));
    expect(document.querySelector<HTMLOutputElement>('[data-date-preview]')!.hidden).toBe(false);
    expect(controller.getState().date).toBe('1999-11');
    slider.dispatchEvent(new Event('change'));
    expect(controller.getState().date).toBe('2022-05');
    expect(slider.getAttribute('aria-valuetext')).toBe('May 2022');
    expect(document.querySelector<HTMLOutputElement>('[data-date-preview]')!.hidden).toBe(true);
  });
  it('submits month/year choices and restores URL state on browser history navigation', () => {
    const fixture = setup('?view=posts&category=Life&date=1999-11');
    const form = document.querySelector<HTMLFormElement>('[data-date-form]')!;
    form.querySelector<HTMLSelectElement>('[name="year"]')!.value = '2010';
    form.querySelector<HTMLSelectElement>('[name="month"]')!.value = '05';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(fixture.controller.getState().date).toBe('2010-05');
    expect(document.querySelector('[data-timeline-empty]')!.textContent).toContain(
      'No moments in May 2010',
    );
    fixture.setUrl('?view=timeline&category=Projects&detail=years&date=2026-10');
    fixture.events.dispatchEvent(new Event('popstate'));
    expect(fixture.controller.getState()).toMatchObject({
      view: 'timeline',
      category: 'Projects',
      detail: 'years',
      date: '2026-10',
    });
  });
  it('synchronizes the date from scrolling and ignores invisible groups or an active empty month', () => {
    const { controller, observers } = setup('', true);
    const target = document.querySelector('[data-period="2022-05"]')!;
    const notify = (intersects: boolean) =>
      observers
        .at(-1)!
        .callback(
          [{ target, isIntersecting: intersects } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
    notify(false);
    expect(controller.getState().date).toBe('2026-11');
    const menu = document.querySelector('[data-date-form]')!.closest('details')!;
    menu.open = true;
    notify(true);
    expect(controller.getState().date).toBe('2026-11');
    menu.open = false;
    notify(true);
    expect(controller.getState().date).toBe('2022-05');
    controller.goToDate('1999-11');
    notify(true);
    expect(controller.getState().date).toBe('1999-11');
    document.dispatchEvent(new Event('wheel'));
    notify(true);
    expect(controller.getState().date).toBe('2022-05');
    controller.goToDate('2010-05');
    document.dispatchEvent(new Event('wheel'));
    notify(true);
    expect(controller.getState().date).toBe('2010-05');
  });
  it('ignores unrelated events and removes listeners and observers during cleanup', () => {
    const { controller, change, observers } = setup('', true);
    change('category', 'Life');
    document.dispatchEvent(new MouseEvent('click'));
    document
      .querySelector('[data-timeline]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.querySelector('select')!.dispatchEvent(new Event('change', { bubbles: true }));
    controller.destroy();
    const previous = controller.getState();
    document.querySelector<HTMLButtonElement>('button[data-view="posts"]')!.click();
    expect(controller.getState()).toEqual(previous);
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
