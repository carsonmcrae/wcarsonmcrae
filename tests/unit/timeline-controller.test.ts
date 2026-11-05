/**
 * Purpose: Behavioral tests for the interactive Daysforth timeline.
 * Scope: Presentation and category state, empty months, clusters, jump focus, rail input, history, and cleanup.
 * Does NOT belong: Visual layout or real-browser accessibility checks.
 * @vitest-environment happy-dom
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
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
describe('timeline interaction', () => {
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
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(24);
    change('category', 'Saved');
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(1);
    expect(document.querySelector('[data-timeline-status]')!.textContent).toBe(
      '1 moment. Timeline view. Saved.',
    );
    save.setAttribute('aria-pressed', 'false');
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(0);
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
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(1);
    controller.destroy();
    save.setAttribute('aria-pressed', 'false');
    document.dispatchEvent(new CustomEvent('daysforth:saved'));
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(1);
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
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(24);
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
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(9);
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
    expect(document.querySelectorAll('[data-moment]')).toHaveLength(24);
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
