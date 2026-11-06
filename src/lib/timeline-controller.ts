/**
 * Purpose: Progressive interaction for the centered timeline.
 * Scope: View/category/detail selection, URL history, date jumps, rail previews, and scroll synchronization.
 * Constraints: Server-rendered moments remain the source of truth and work without this module.
 * Does NOT belong: Social actions or date/grouping calculations.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { dateLabel, monthAt, monthIndex, periodKey } from './timeline-dates';
import {
  chronological,
  nearestMoment,
  readTimelineState,
  stateSearch,
  type TimelineState,
} from './timeline-model';
import { readMomentCards, renderMomentGroups } from './timeline-render';
import { prepareTimelineRestore } from './page-position';

type TimelineWindow = Pick<
  Window,
  'location' | 'history' | 'scrollTo' | 'innerHeight' | 'addEventListener' | 'removeEventListener'
> & { IntersectionObserver?: typeof IntersectionObserver };
export type TimelineCommandKind = 'click' | 'change' | 'input' | 'submit';
export function initTimeline(
  doc: Document,
  win: TimelineWindow,
  { preservePosition = false }: { preservePosition?: boolean } = {},
) {
  const root = doc.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return null;
  const container = root.querySelector<HTMLElement>('[data-timeline-groups]')!;
  const empty = root.querySelector<HTMLElement>('[data-timeline-empty]')!;
  const status = root.querySelector<HTMLElement>('[data-timeline-status]')!;
  const cards = readMomentCards(container);
  const latest = chronological(cards)[0]!.date;
  let state = readTimelineState(win.location.search, latest);
  let visible = cards;
  let observer: IntersectionObserver | undefined;
  let exploring = false;
  let followingScroll = true;
  const scrollIntents = ['wheel', 'touchmove', 'keydown'];
  const follow = () => {
    followingScroll = true;
  };
  const slider = doc.querySelector<HTMLInputElement>('[data-date-slider]')!;
  const preview = doc.querySelector<HTMLOutputElement>('[data-date-preview]')!;
  const form = doc.querySelector<HTMLFormElement>('[data-date-form]')!;
  const month = form.querySelector<HTMLSelectElement>('[name="month"]')!;
  const year = form.querySelector<HTMLSelectElement>('[name="year"]')!;

  const saveUrl = (push = false) => {
    const url = new URL(win.location.href);
    url.search = stateSearch(state);
    if (push) {
      const next: Record<string, unknown> = { ...win.history.state };
      delete next['scrollY'];
      win.history.pushState(next, '', url);
    } else win.history.replaceState(win.history.state, '', url);
    doc.dispatchEvent(new CustomEvent('daysforth:history'));
  };
  const syncDate = () => {
    doc.querySelector<HTMLElement>('[data-current-date]')!.textContent = dateLabel(state.date);
    slider.value = String(monthIndex(state.date));
    slider.setAttribute('aria-valuetext', dateLabel(monthAt(Number(slider.value))));
    month.value = state.date.slice(5, 7);
    year.value = state.date.slice(0, 4);
  };
  const render = () => {
    root.dataset['view'] = state.view;
    root.dataset['detail'] = state.detail;
    visible = renderMomentGroups(doc, container, cards, state);
    doc.querySelector<HTMLElement>('[data-category-label]')!.textContent =
      state.category === 'All' ? 'All categories' : state.category;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-view]'))
      button.setAttribute('aria-pressed', String(button.dataset['view'] === state.view));
    for (const input of root.querySelectorAll<HTMLInputElement>(
      '[name="category"], [name="detail"]',
    ))
      input.checked = input.value === state[input.name as 'category' | 'detail'];
    const categorySymbol = root
      .querySelector('[name="category"]:checked')!
      .closest('label')!
      .querySelector('use')!;
    doc
      .querySelector('[data-category-icon] use')!
      .setAttribute('href', categorySymbol.getAttribute('href')!);
    empty.hidden = visible.length > 0;
    if (!empty.hidden) empty.textContent = 'No saved moments in this browser yet.';
    syncDate();
    observer?.disconnect();
    if (win.IntersectionObserver) {
      observer = new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (
              entry.isIntersecting &&
              !exploring &&
              followingScroll &&
              empty.hidden &&
              !form.closest('details')!.open
            ) {
              state.date = (entry.target as HTMLElement).dataset['periodDate']!;
              syncDate();
              saveUrl();
            }
          }
        },
        { rootMargin: '-35% 0px -60% 0px' },
      );
      for (const group of container.children) observer.observe(group);
    }
    status.textContent = `${visible.length} ${visible.length === 1 ? 'moment' : 'moments'}. ${state.view === 'timeline' ? 'Timeline' : 'Posts'} view. ${state.category === 'All' ? 'All categories' : state.category}.`;
  };
  const closeMenus = () => {
    for (const menu of root.querySelectorAll<HTMLDetailsElement>('[data-timeline-menu]'))
      menu.open = false;
  };
  const dateDestination = (momentId?: string) => {
    const exact = visible.filter((card) => card.date.startsWith(state.date));
    empty.hidden = exact.length > 0;
    let destination: HTMLElement;
    let focusTarget: HTMLElement | null = null;
    if (exact.length > 0) {
      const group = container.querySelector<HTMLElement>(
        `[data-period="${periodKey(state.date, state.detail)}"]`,
      )!;
      const cluster = group.querySelector('details');
      if (cluster) cluster.open = true;
      const target = exact.find((card) => card.id === momentId);
      destination = target?.element ?? group.querySelector('h2')!;
      focusTarget = target ? target.element.querySelector<HTMLElement>('h3 a')! : null;
    } else {
      const message = doc.createElement('p');
      const category = state.category === 'All' ? '' : ` for ${state.category}`;
      message.textContent = `No moments in ${dateLabel(state.date)}${category}.`;
      empty.replaceChildren(message);
      const nearby = nearestMoment(visible, state.date)!;
      const link = doc.createElement('a');
      link.href = `#moment-${nearby.id}`;
      link.dataset['jumpDate'] = nearby.date;
      link.textContent = `Go to the nearest moment · ${dateLabel(nearby.date)}`;
      empty.append(link);
      destination = empty;
    }
    return { destination, focusTarget };
  };
  const goToDate = (
    date: string,
    focus = true,
    historyMode: 'push' | 'replace' | 'none' = 'push',
    momentId?: string,
  ) => {
    followingScroll = false;
    state.date = date.slice(0, 7);
    if (visible.length === 0) {
      syncDate();
      if (historyMode !== 'none') saveUrl(historyMode === 'push');
      closeMenus();
      if (focus) empty.focus();
      return;
    }
    const { destination, focusTarget } = dateDestination(momentId);
    syncDate();
    if (historyMode !== 'none') saveUrl(historyMode === 'push');
    closeMenus();
    const atStart =
      destination === empty ||
      (!focusTarget && destination.closest('.moment-group') === container.firstElementChild);
    (atStart ? root : destination).scrollIntoView({ block: 'start', behavior: 'instant' });
    if (focus) (focusTarget ?? destination).focus({ preventScroll: true });
  };
  const click = (target: Element) => {
    const jump = target.closest<HTMLElement>('[data-jump-date]');
    if (jump) {
      const edges: Record<string, (typeof visible)[number] | undefined> = {
        newest: visible[0],
        oldest: visible.at(-1),
      };
      goToDate(
        edges[jump.dataset['timelineEdge'] ?? '']?.date ?? jump.dataset['jumpDate']!,
        true,
        'push',
        jump.dataset['jumpMoment'],
      );
      return true;
    }
    const button = target.closest<HTMLButtonElement>('button[data-view]');
    if (button) {
      const browsing = root.getBoundingClientRect().top < 0;
      state.view = button.dataset['view'] as TimelineState['view'];
      render();
      if (browsing) goToDate(state.date, false, 'none');
      saveUrl(true);
      return true;
    }
    return false;
  };
  const onClick = (event: MouseEvent) => {
    if (event.target instanceof Element && click(event.target)) event.preventDefault();
  };
  const change = (input: Element) => {
    if (!(input instanceof HTMLInputElement)) return;
    if (input.name === 'category' || input.name === 'detail') {
      if (input.name === 'category') state.category = input.value as TimelineState['category'];
      else state.detail = input.value as TimelineState['detail'];
      render();
      goToDate(state.date, false, 'none');
      saveUrl(true);
      const summary = input.closest('details')!.querySelector('summary')!;
      closeMenus();
      summary.focus();
    }
    if (input === slider) {
      preview.hidden = true;
      goToDate(monthAt(Number(slider.value)), false);
      exploring = false;
    }
  };
  const onChange = (event: Event) => {
    if (event.target instanceof Element) change(event.target);
  };
  const onInput = () => {
    exploring = true;
    preview.hidden = false;
    preview.textContent = dateLabel(monthAt(Number(slider.value)));
  };
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    goToDate(`${year.value}-${month.value}`);
  };
  const onPopState = () => {
    state = readTimelineState(win.location.search, latest);
    render();
    const position = prepareTimelineRestore(win);
    if (position === null) goToDate(state.date, false, 'none');
    else win.scrollTo({ top: position, behavior: 'instant' });
  };
  const onSaved = () => {
    if (state.category === 'Saved') {
      render();
      doc.querySelector<HTMLElement>('[data-category-label]')!.closest('summary')!.focus();
    }
  };
  render();
  if (preservePosition) {
    const reading = [...container.children].find((group) => {
      const bounds = group.getBoundingClientRect();
      return bounds.bottom > win.innerHeight * 0.35 && bounds.top < win.innerHeight * 0.4;
    }) as HTMLElement | undefined;
    if (reading) {
      state.date = reading.dataset['periodDate']!;
      syncDate();
      saveUrl();
    }
  }
  doc.addEventListener('click', onClick);
  doc.addEventListener('change', onChange, true);
  slider.addEventListener('input', onInput);
  form.addEventListener('submit', onSubmit);
  win.addEventListener('popstate', onPopState);
  doc.addEventListener('daysforth:saved', onSaved);
  for (const intent of scrollIntents) doc.addEventListener(intent, follow, { passive: true });
  if (
    !preservePosition &&
    new URLSearchParams(win.location.search).has('date') &&
    prepareTimelineRestore(win) === null
  )
    goToDate(state.date, false, 'replace');
  return {
    getState: () => ({ ...state }),
    goToDate,
    activate: (target: Element, kind: TimelineCommandKind) => {
      switch (kind) {
        case 'click':
          click(target);
          break;
        case 'change':
          change(target);
          break;
        case 'input':
          if (target === slider) onInput();
          break;
        case 'submit':
          goToDate(`${year.value}-${month.value}`);
          break;
      }
    },
    destroy: () => {
      observer?.disconnect();
      doc.removeEventListener('click', onClick);
      doc.removeEventListener('change', onChange, true);
      slider.removeEventListener('input', onInput);
      form.removeEventListener('submit', onSubmit);
      win.removeEventListener('popstate', onPopState);
      doc.removeEventListener('daysforth:saved', onSaved);
      for (const intent of scrollIntents) doc.removeEventListener(intent, follow);
    },
  };
}
