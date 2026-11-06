/**
 * Purpose: Preserve timeline commands and static reading across deferred input-controller loading.
 * Scope: Initial monthly presentation, original-control handoff, captured values, restore, and disposal.
 * Does NOT belong: Real-browser layout, synthetic browser intent, or alternate timeline algorithms.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initDeferredTimeline } from '../../src/lib/timeline-loader';
import { monthIndex } from '../../src/lib/timeline-dates';
import { timelinePosts } from '../../src/data/timeline';
import { timelineFixture } from './timeline-fixture';
import { initTimeline } from '../../src/lib/timeline-controller';
import type * as MomentNavigation from '../../src/lib/moment-navigator';
import { disposeDocument, fakeMediaQuery } from './helpers';
import {
  timelineLoadingFixture as fixture,
  attachTimelineGeometry,
  setReadingMonth,
} from './timeline-loading-fixture';

type Controller = NonNullable<ReturnType<typeof initTimeline>>;
const stops: (() => void)[] = [];
afterEach(() => {
  disposeDocument(stops);
  delete document.documentElement.dataset['timelineRestore'];
  delete document.documentElement.dataset['timelineReady'];
  delete document.documentElement.dataset['timelineFallback'];
  vi.unstubAllGlobals();
});

function monthlySection(date: string) {
  return [...document.querySelectorAll<HTMLElement>('.moment-group--year .moment-group')].find(
    (section) => section.querySelector('time')!.dateTime.startsWith(date),
  )!;
}

async function choosePosts() {
  document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
  await vi.waitFor(() =>
    expect(document.querySelector<HTMLElement>('[data-timeline]')!.dataset['view']).toBe('posts'),
  );
}

function controlled() {
  const f = fixture();
  const task = Promise.withResolvers<Controller>();
  const activate = vi.fn<Controller['activate']>();
  const destroy = vi.fn();
  const controller = { ...f.controller, activate, destroy };
  const load = vi.fn(() => task.promise);
  stops.push(initDeferredTimeline(document, f.win, load));
  return { ...f, task, activate, destroy, controller, load };
}

it('uses the server monthly structure without any DOM replacement before loading the input controller', () => {
  const f = fixture();
  const before = f.container.innerHTML;
  const replace = vi.spyOn(f.container, 'replaceChildren');
  const load = vi.fn<() => Promise<Controller>>();
  const stop = initDeferredTimeline(document, f.win, load);
  stops.push(stop);
  expect(load).not.toHaveBeenCalled();
  expect(document.querySelectorAll('.post-card')).toHaveLength(timelinePosts.length);
  expect(monthlySection('2026-10').querySelectorAll('.post-card')).toHaveLength(3);
  expect(f.container.querySelector('.post-card')).toBe(f.cards[0]);
  expect(monthlySection('2026-11').querySelector('h2')!.textContent).toBe('November 2026');
  expect(f.container.innerHTML).toBe(before);
  expect(replace).not.toHaveBeenCalled();
  expect(f.container.querySelector('.moment-group--year > h2')!.textContent).toBe('2026');
});

it('ignores unrelated events but preloads on focus without inventing a command', async () => {
  const f = controlled();
  document.dispatchEvent(new Event('input'));
  const outside = document.createElement('input');
  document.body.append(outside);
  outside.dispatchEvent(new Event('change', { bubbles: true }));
  outside.click();
  expect(f.load).not.toHaveBeenCalled();
  document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.focus();
  expect(f.load).toHaveBeenCalledOnce();
  f.task.resolve(f.controller);
  await vi.waitFor(() => expect(document.documentElement.dataset['timelineReady']).toBe('true'));
  expect(f.activate).not.toHaveBeenCalled();
});

it('hands the original native clicked control to one controller without redispatching a click', async () => {
  const f = controlled();
  const target = document.querySelector<HTMLButtonElement>('[data-view="posts"]')!;
  const bubbled = vi.fn();
  document.addEventListener('click', bubbled, { once: true });
  target.querySelector('span')!.click();
  expect(f.load).toHaveBeenCalledOnce();
  f.task.resolve(f.controller);
  await vi.waitFor(() => expect(f.activate).toHaveBeenCalledOnce());
  expect(f.activate).toHaveBeenCalledWith(target, 'click');
  expect(bubbled).toHaveBeenCalledOnce();
});

it('isolates one buffered command exception while delivering the next original command', async () => {
  const f = controlled();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const posts = document.querySelector<HTMLButtonElement>('[data-view="posts"]')!;
  const timeline = document.querySelector<HTMLButtonElement>('button[data-view="timeline"]')!;
  f.activate.mockImplementationOnce(() => {
    throw new Error('private content');
  });
  posts.click();
  timeline.click();
  f.task.resolve(f.controller);
  await vi.waitFor(() => expect(f.activate).toHaveBeenCalledTimes(2));
  expect(f.activate).toHaveBeenNthCalledWith(2, timeline, 'click');
  expect(warning.mock.calls[0]![1]).toMatchObject({
    component: 'timeline',
    category: 'activation',
  });
  expect(document.documentElement.dataset['timelineFallback']).toBeUndefined();
});

it('captures submitted date values before subsequent edits while the module is pending', async () => {
  const f = controlled();
  const form = document.querySelector<HTMLFormElement>('[data-date-form]')!;
  const year = form.querySelector<HTMLSelectElement>('[name="year"]')!;
  const month = form.querySelector<HTMLSelectElement>('[name="month"]')!;
  year.value = '2022';
  month.value = '05';
  const observed: string[] = [];
  f.activate.mockImplementation((_target, kind) => {
    if (kind === 'submit') observed.push(`${year.value}-${month.value}`);
  });
  const submit = new SubmitEvent('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submit);
  expect(submit.defaultPrevented).toBe(true);
  month.value = '06';
  month.dispatchEvent(new Event('change', { bubbles: true }));
  f.task.resolve(f.controller);
  await vi.waitFor(() => expect(observed).toEqual(['2022-05']));
  expect(month.value).toBe('06');
  expect(f.load).toHaveBeenCalledOnce();
});

it('preserves rapid native radio choices and slider values in command order', async () => {
  const f = controlled();
  const work = document.querySelector<HTMLInputElement>('[name="category"][value="Work"]')!;
  const life = document.querySelector<HTMLInputElement>('[name="category"][value="Life"]')!;
  const slider = document.querySelector<HTMLInputElement>('[data-date-slider]')!;
  const observed: { target: Element; kind: string; value: string; checked: boolean }[] = [];
  f.activate.mockImplementation((target, kind) => {
    const input = target as HTMLInputElement;
    observed.push({ target, kind, value: input.value, checked: input.checked });
  });
  work.click();
  life.click();
  slider.value = String(monthIndex('2022-05'));
  slider.dispatchEvent(new Event('input', { bubbles: true }));
  slider.value = String(monthIndex('2026-10'));
  slider.dispatchEvent(new Event('change', { bubbles: true }));
  f.task.resolve(f.controller);
  await vi.waitFor(() => expect(observed).toHaveLength(4));
  expect(observed.map(({ target, kind, value }) => ({ target, kind, value }))).toEqual([
    { target: work, kind: 'change', value: 'Work' },
    { target: life, kind: 'change', value: 'Life' },
    { target: slider, kind: 'input', value: String(monthIndex('2022-05')) },
    { target: slider, kind: 'change', value: String(monthIndex('2026-10')) },
  ]);
  expect(observed[0]!.checked).toBe(true);
  expect(observed[1]!.checked).toBe(true);
});

it.each(['resolve', 'reject'] as const)(
  'cancels pending commands when the document is disposed before load can %s',
  async (outcome) => {
    const f = controlled();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
    stops.splice(0).forEach((stop) => stop());
    if (outcome === 'resolve') f.task.resolve(f.controller);
    else f.task.reject(new Error('late optional chunk failure'));
    await f.task.promise.catch(() => {});
    await vi.waitFor(() => {
      expect(f.destroy).toHaveBeenCalledTimes(outcome === 'resolve' ? 1 : 0);
      expect(f.activate).not.toHaveBeenCalled();
    });
    expect(warning).not.toHaveBeenCalled();
  },
);

it('keeps static reading after a failed import and exposes terminal fallback without repeated retry noise', async () => {
  const f = fixture();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const activate = vi.fn<Controller['activate']>();
  const load = vi.fn<() => Promise<Controller>>().mockRejectedValueOnce(new Error('private-url'));
  stops.push(initDeferredTimeline(document, f.win, load));
  const target = document.querySelector<HTMLButtonElement>('[data-view="posts"]')!;
  target.click();
  await vi.waitFor(() => expect(warning).toHaveBeenCalled());
  expect(document.querySelectorAll('.post-card')).toHaveLength(timelinePosts.length);
  expect(monthlySection('2026-11')).toBeDefined();
  expect(activate).not.toHaveBeenCalled();
  expect(document.documentElement.dataset['timelineFallback']).toBe('');
  target.click();
  expect(load).toHaveBeenCalledOnce();
  expect(warning).toHaveBeenCalledOnce();
  expect(warning.mock.calls[0]![1]).toMatchObject({ component: 'timeline', category: 'load' });
});

it.each(['?date=2022-05', '?view=posts', '?category=Work', '?detail=years'])(
  'activates the controller immediately for explicit browsing state %s',
  async (search) => {
    const f = fixture(search);
    const load = vi.fn(async () => f.controller);
    stops.push(initDeferredTimeline(document, f.win, load));
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
  },
);

it.each(['resolve', 'reject'] as const)(
  'releases the inert restore hold when loading can %s',
  async (outcome) => {
    const f = fixture('?date=2022-05');
    const main = document.createElement('main');
    main.inert = true;
    main.append(...document.body.childNodes);
    document.body.append(main);
    document.documentElement.dataset['timelineRestore'] = '';
    const task = Promise.withResolvers<Controller>();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stops.push(initDeferredTimeline(document, f.win, () => task.promise));
    expect(main.inert).toBe(true);
    if (outcome === 'resolve') task.resolve(f.controller);
    else task.reject(new Error('unavailable module'));
    await vi.waitFor(() => expect(main.inert).toBe(false));
    expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(false);
    expect(
      document.documentElement.hasAttribute(
        `data-timeline-${outcome === 'resolve' ? 'ready' : 'fallback'}`,
      ),
    ).toBe(true);
  },
);

it.each([0, 740])(
  'loads a valid history restoration position %s without a date query',
  async (position) => {
    const f = fixture('', position);
    const load = vi.fn(async () => f.controller);
    stops.push(initDeferredTimeline(document, f.win, load));
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
    await vi.waitFor(() =>
      expect(f.win.scrollTo).toHaveBeenCalledWith({ top: position, behavior: 'instant' }),
    );
  },
);

it('leaves unrelated pages inert and returns usable loader cleanup', () => {
  const load = vi.fn<() => Promise<Controller>>();
  initDeferredTimeline(document, window, load)();
  expect(load).not.toHaveBeenCalled();
});

it('delivers all four semantic commands through the real controller and ignores non-element changes', () => {
  const f = timelineFixture();
  stops.push(f.controller.destroy);
  const posts = document.querySelector<HTMLButtonElement>('[data-view="posts"]')!;
  f.controller.activate(posts, 'click');
  expect(f.controller.getState().view).toBe('posts');
  const work = document.querySelector<HTMLInputElement>('[name="category"][value="Work"]')!;
  work.checked = true;
  f.controller.activate(work, 'change');
  expect(f.controller.getState().category).toBe('Work');
  const slider = document.querySelector<HTMLInputElement>('[data-date-slider]')!;
  f.controller.activate(work, 'input');
  expect(document.querySelector<HTMLOutputElement>('[data-date-preview]')!.hidden).toBe(true);
  slider.value = String(monthIndex('2022-05'));
  f.controller.activate(slider, 'input');
  expect(document.querySelector<HTMLOutputElement>('[data-date-preview]')!.hidden).toBe(false);
  const form = document.querySelector<HTMLFormElement>('[data-date-form]')!;
  form.querySelector<HTMLSelectElement>('[name="year"]')!.value = '2022';
  form.querySelector<HTMLSelectElement>('[name="month"]')!.value = '05';
  f.controller.activate(form, 'submit');
  expect(f.controller.getState().date).toBe('2022-05');
  document.dispatchEvent(new Event('change'));
  expect(f.controller.getState().date).toBe('2022-05');
});

it('loads the actual controller for an initial date query and restores ordinary interaction', async () => {
  const f = fixture('?date=2022-05');
  stops.push(initDeferredTimeline(document, f.win));
  await vi.waitFor(() => expect(document.documentElement.dataset['timelineReady']).toBe('true'));
  expect(document.querySelector('[data-current-date]')!.textContent).toBe('May 2022');
  await choosePosts();
});

it('preserves the first native view command while the actual controller loads after default presentation', async () => {
  const f = fixture();
  setReadingMonth(f, '2022-05');
  stops.push(initDeferredTimeline(document, f.win));
  await choosePosts();
  expect(f.history.pushState).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('.post-card')).toHaveLength(timelinePosts.length);
  expect(document.querySelector('[data-current-date]')!.textContent).toBe('May 2022');
  expect(new URL(f.win.location.href).searchParams.get('date')).toBe('2022-05');
  expect(f.scrolling).not.toHaveBeenCalled();
});

it('hands the first actual scroll to shortcuts without a second gesture or a new date jump', async () => {
  const f = fixture();
  const { up, down } = attachTimelineGeometry(f);
  Object.defineProperty(f.win, 'matchMedia', { value: () => fakeMediaQuery(false) });
  stops.push(initDeferredTimeline(document, f.win));
  f.events.dispatchEvent(new Event('scroll'));
  expect([up.hidden, down.hidden]).toEqual([true, true]);
  f.events.dispatchEvent(new Event('wheel'));
  Object.defineProperty(f.win, 'scrollY', { value: 300, configurable: true });
  f.events.dispatchEvent(new Event('scroll'));
  await vi.waitFor(() => expect([up.hidden, down.hidden]).toEqual([false, false]));
  expect(f.scrolling).not.toHaveBeenCalled();
  expect(f.win.scrollTo).not.toHaveBeenCalled();
});

it('keeps the core controller usable when the media-query capability throws', async () => {
  const f = fixture();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  Object.defineProperty(f.win, 'matchMedia', {
    value: () => {
      throw new Error('unsupported capability');
    },
  });
  stops.push(initDeferredTimeline(document, f.win));
  await choosePosts();
  expect(document.documentElement.dataset['timelineFallback']).toBeUndefined();
});

it.each([false, true])(
  'isolates a failed optional desktop prefetch after disposal=%s',
  async (dispose) => {
    const task = Promise.withResolvers<typeof MomentNavigation>();
    const factory = vi.fn(() => task.promise);
    vi.resetModules();
    vi.doMock('../../src/lib/moment-navigator', factory);
    try {
      const { initDeferredTimeline: initialize } = await import('../../src/lib/timeline-loader');
      const f = fixture();
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Object.defineProperty(f.win, 'matchMedia', { value: () => fakeMediaQuery(true) });
      const stop = initialize(document, f.win);
      document.querySelector<HTMLButtonElement>('[data-view="posts"]')!.click();
      await vi.waitFor(() => expect(factory).toHaveBeenCalledOnce());
      if (dispose) stop();
      else stops.push(stop);
      task.reject(new Error('private request URL'));
      await vi.dynamicImportSettled();
      if (dispose) expect(warning).not.toHaveBeenCalled();
      else {
        expect(warning.mock.calls[0]![1]).toMatchObject({
          component: 'timeline',
          category: 'load',
        });
        expect(document.querySelector<HTMLElement>('[data-timeline]')!.dataset['view']).toBe(
          'posts',
        );
        expect(document.documentElement.dataset['timelineFallback']).toBeUndefined();
      }
    } finally {
      vi.doUnmock('../../src/lib/moment-navigator');
      vi.resetModules();
    }
  },
);

it('does not mount the real deferred controller after the initial document has been disposed', async () => {
  const f = fixture('?date=2022-05');
  initDeferredTimeline(document, f.win)();
  await vi.dynamicImportSettled();
  expect(f.container.querySelector('.moment-group--year')).not.toBeNull();
  expect(document.documentElement.dataset['timelineReady']).toBeUndefined();
});

it('preserves a reading-date query during controller handoff without turning it into a new jump', () => {
  const f = fixture('?date=2026-11');
  setReadingMonth(f, '2022-05');
  const controller = initTimeline(document, f.win, { preservePosition: true })!;
  stops.push(controller.destroy);
  expect(controller.getState().date).toBe('2022-05');
  controller.activate(document.querySelector('button[data-view="posts"]')!, 'click');
  expect(controller.getState()).toMatchObject({ view: 'posts', date: '2022-05' });
  expect(f.scrolling).not.toHaveBeenCalled();
  expect(document.querySelector('[data-current-date]')!.textContent).toBe('May 2022');
});
