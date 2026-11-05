/**
 * Purpose: Progressive interaction for the centered timeline.
 * Scope: View/category/detail selection, URL history, date jumps, rail previews, and scroll synchronization.
 * Constraints: Server-rendered moments remain the source of truth and work without this module.
 * Does NOT belong: Social actions or date/grouping calculations.
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

type TimelineWindow = Pick<
  Window,
  'location' | 'history' | 'addEventListener' | 'removeEventListener'
> & { IntersectionObserver?: typeof IntersectionObserver };
export function initTimeline(doc: Document, win: TimelineWindow) {
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
  const slider = doc.querySelector<HTMLInputElement>('[data-date-slider]')!;
  const preview = doc.querySelector<HTMLOutputElement>('[data-date-preview]')!;
  const form = doc.querySelector<HTMLFormElement>('[data-date-form]')!;

  const saveUrl = (push = false) => {
    const url = new URL(win.location.href);
    url.search = stateSearch(state);
    if (push) win.history.pushState(null, '', url);
    else win.history.replaceState(null, '', url);
  };
  const syncDate = () => {
    doc.querySelector<HTMLElement>('[data-current-date]')!.textContent = dateLabel(state.date);
    slider.value = String(monthIndex(state.date));
    slider.setAttribute('aria-valuetext', dateLabel(monthAt(Number(slider.value))));
    form.querySelector<HTMLSelectElement>('[name="month"]')!.value = state.date.slice(5, 7);
    form.querySelector<HTMLSelectElement>('[name="year"]')!.value = state.date.slice(0, 4);
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
    empty.hidden = visible.length > 0;
    if (!empty.hidden) empty.textContent = 'No saved moments in this browser yet.';
    syncDate();
    observer?.disconnect();
    if (win.IntersectionObserver) {
      observer = new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && empty.hidden && !form.closest('details')!.open) {
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
  const goToDate = (
    date: string,
    focus = true,
    historyMode: 'push' | 'replace' | 'none' = 'push',
  ) => {
    state.date = date.slice(0, 7);
    if (visible.length === 0) {
      syncDate();
      if (historyMode !== 'none') saveUrl(historyMode === 'push');
      closeMenus();
      if (focus) empty.focus();
      return;
    }
    const exact = visible.filter((card) => card.date.startsWith(state.date));
    empty.hidden = exact.length > 0;
    let destination: HTMLElement;
    if (exact.length > 0) {
      const group = container.querySelector<HTMLElement>(
        `[data-period="${periodKey(state.date, state.detail)}"]`,
      )!;
      const cluster = group.querySelector('details');
      if (cluster) cluster.open = true;
      destination = group.querySelector('h2')!;
    } else {
      const message = doc.createElement('p');
      message.textContent = `No moments in ${dateLabel(state.date)}${state.category === 'All' ? '' : ` for ${state.category}`}.`;
      empty.replaceChildren(message);
      const nearby = nearestMoment(visible, state.date)!;
      const link = doc.createElement('a');
      link.href = `#moment-${nearby.id}`;
      link.dataset['jumpDate'] = nearby.date;
      link.textContent = `Go to the nearest moment · ${dateLabel(nearby.date)}`;
      empty.append(link);
      destination = empty;
    }
    syncDate();
    if (historyMode !== 'none') saveUrl(historyMode === 'push');
    closeMenus();
    destination.scrollIntoView({ block: 'start' });
    if (focus) destination.focus({ preventScroll: true });
  };
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const jump = event.target.closest<HTMLElement>('[data-jump-date]');
    if (jump) {
      event.preventDefault();
      goToDate(jump.dataset['jumpDate']!);
      return;
    }
    const button = event.target.closest<HTMLButtonElement>('button[data-view]');
    if (button) {
      state.view = button.dataset['view'] as TimelineState['view'];
      render();
      goToDate(state.date, false, 'none');
      saveUrl(true);
    }
  };
  const onChange = (event: Event) => {
    const input = event.target;
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
    }
  };
  const onInput = () => {
    preview.hidden = false;
    preview.textContent = dateLabel(monthAt(Number(slider.value)));
  };
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const values = new FormData(form);
    goToDate(`${values.get('year')}-${values.get('month')}`);
  };
  const onPopState = () => {
    state = readTimelineState(win.location.search, latest);
    render();
    goToDate(state.date, false, 'none');
  };
  const onSaved = () => {
    if (state.category === 'Saved') {
      render();
      doc.querySelector<HTMLElement>('[data-category-label]')!.closest('summary')!.focus();
    }
  };
  render();
  doc.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  slider.addEventListener('change', onChange);
  slider.addEventListener('input', onInput);
  form.addEventListener('submit', onSubmit);
  win.addEventListener('popstate', onPopState);
  doc.addEventListener('daysforth:saved', onSaved);
  if (new URLSearchParams(win.location.search).has('date')) goToDate(state.date, false, 'replace');
  return {
    getState: () => ({ ...state }),
    goToDate,
    destroy: () => {
      observer?.disconnect();
      doc.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      slider.removeEventListener('change', onChange);
      slider.removeEventListener('input', onInput);
      form.removeEventListener('submit', onSubmit);
      win.removeEventListener('popstate', onPopState);
      doc.removeEventListener('daysforth:saved', onSaved);
    },
  };
}
