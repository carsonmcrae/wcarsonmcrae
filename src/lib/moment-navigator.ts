/**
 * Purpose: Browse live timeline cards through a compact desktop rail and preview list.
 * Scope: Rendered-card metadata, active geometry, passive ticks, keyboard previews, and cleanup.
 * Does NOT belong: Filtering, date/history state, or persistent preferences.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { dateLabel } from './timeline-dates';
import { readTimelineViewport } from './timeline-viewport';
import { readMomentCards, type MomentCard } from './timeline-render';
type NavigatorWindow = Pick<
  Window,
  | 'innerHeight'
  | 'matchMedia'
  | 'addEventListener'
  | 'removeEventListener'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
>;

function previewIndex(key: string, current: number, length: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return Math.min(length - 1, current + 1);
    case 'ArrowUp':
      return Math.max(0, current - 1);
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

export function initMomentNavigator(doc: Document, win: NavigatorWindow): () => void {
  const root = doc.querySelector<HTMLElement>('[data-timeline]');
  const widget = doc.querySelector<HTMLElement>('[data-moment-navigator]');
  if (!root || !widget) return () => {};
  const rail = widget.querySelector<HTMLButtonElement>('[data-moment-rail]')!;
  const panel = widget.querySelector<HTMLElement>('[data-moment-previews]')!;
  const list = widget.querySelector<HTMLOListElement>('[data-moment-links]')!;
  const tickList = widget.querySelector<HTMLElement>('[data-moment-ticks]')!;
  const groups = root.querySelector<HTMLElement>('[data-timeline-groups]')!;
  const desktop = win.matchMedia('(min-width: 70rem)');
  let cards: MomentCard[] = [];
  let links: HTMLAnchorElement[] = [];
  let ticks: HTMLElement[] = [];
  let active = -1;
  let preview = -1;
  let frame: number | undefined;
  const clearPreview = () => {
    if (preview < 0) return;
    delete links[preview]!.dataset['preview'];
    delete ticks[preview]!.dataset['preview'];
    preview = -1;
  };
  const close = () => {
    if (!panel.hidden) panel.hidden = true;
    if (rail.getAttribute('aria-expanded') !== 'false') rail.setAttribute('aria-expanded', 'false');
    clearPreview();
  };
  const open = () => {
    if (widget.hidden) return;
    if (panel.hidden) panel.hidden = false;
    if (rail.getAttribute('aria-expanded') !== 'true') rail.setAttribute('aria-expanded', 'true');
  };
  const focus = (index: number) => {
    open();
    clearPreview();
    links[index]!.focus({ preventScroll: true });
    revealRow(index);
  };
  const revealRow = (index: number) => {
    const link = links[index]!;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < panel.scrollTop) panel.scrollTop = top;
    else if (bottom > panel.scrollTop + panel.clientHeight)
      panel.scrollTop = bottom - panel.clientHeight;
  };
  const setHidden = (hidden: boolean) => {
    if (widget.hidden !== hidden) widget.hidden = hidden;
    if (hidden) close();
  };
  const setCurrent = (index: number, current: boolean) => {
    if (index < 0) return;
    links[index]!.setAttribute('aria-current', String(current));
    ticks[index]!.dataset['active'] = String(current);
  };
  const update = () => {
    if (!desktop.matches || root.dataset['view'] !== 'timeline' || cards.length === 0) {
      setHidden(true);
      return;
    }
    const viewport = readTimelineViewport(root, win);
    setHidden(!viewport.inside);
    if (!viewport.inside) return;
    const next = cards.findIndex((card) => {
      const bounds = card.element.getBoundingClientRect();
      return bounds.bottom > viewport.readingTop && bounds.top < win.innerHeight;
    });
    if (next === active) return;
    setCurrent(active, false);
    setCurrent(next, true);
    active = next;
  };
  const schedule = () => {
    frame ??= win.requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  };
  const rebuild = () => {
    cards = readMomentCards(groups);
    links = [];
    ticks = [];
    active = -1;
    preview = -1;
    list.replaceChildren();
    tickList.replaceChildren();
    for (const card of cards) {
      const id = card.id;
      const link = doc.createElement('a');
      link.href = `#moment-${id}`;
      link.dataset['jumpDate'] = card.date;
      link.dataset['jumpMoment'] = id;
      link.tabIndex = 0;
      link.setAttribute('aria-current', 'false');
      const title = doc.createElement('strong');
      title.textContent = card.element.querySelector('h3')!.textContent.trim();
      const date = doc.createElement('span');
      date.textContent = dateLabel(card.date);
      link.append(title, date);
      const item = doc.createElement('li');
      item.append(link);
      list.append(item);
      const tick = doc.createElement('span');
      tick.dataset['active'] = 'false';
      tickList.append(tick);
      links.push(link);
      ticks.push(tick);
    }
    update();
  };
  const pointerIndex = (event: MouseEvent) => {
    const bounds = rail.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(
        cards.length - 1,
        Math.floor(((event.clientY - bounds.top) / bounds.height) * cards.length),
      ),
    );
  };
  const move = (event: PointerEvent) => {
    if (widget.hidden || links.length === 0) return;
    open();
    const index = pointerIndex(event);
    if (index === preview) return;
    clearPreview();
    links[index]!.dataset['preview'] = 'true';
    ticks[index]!.dataset['preview'] = 'true';
    preview = index;
    revealRow(index);
  };
  const clickRail = (event: MouseEvent) => {
    if (widget.hidden || links.length === 0) return;
    if (event.detail === 0) {
      focus(Math.max(0, active));
      return;
    }
    links[pointerIndex(event)]!.click();
  };
  const key = (event: KeyboardEvent) => {
    if (widget.hidden || links.length === 0) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      rail.focus({ preventScroll: true });
      close();
      return;
    }
    const current = links.indexOf(doc.activeElement as HTMLAnchorElement);
    const index = previewIndex(
      event.key,
      current < 0 ? Math.max(0, active) : current,
      links.length,
    );
    if (index === null) return;
    event.preventDefault();
    focus(index);
  };
  const leave = () => {
    clearPreview();
    if (!widget.contains(doc.activeElement)) close();
  };
  const blur = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node) || !widget.contains(event.relatedTarget)) close();
  };
  const outside = (event: MouseEvent) => {
    if (!(event.target instanceof Node) || !widget.contains(event.target)) close();
  };
  const choose = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest('a')) close();
  };
  const observer = new MutationObserver(rebuild);
  observer.observe(groups, { childList: true });
  observer.observe(root, { attributes: true, attributeFilter: ['data-view'] });
  rail.addEventListener('click', clickRail);
  rail.addEventListener('pointermove', move);
  rail.addEventListener('pointerleave', clearPreview);
  rail.addEventListener('focus', open);
  widget.addEventListener('pointerenter', open);
  widget.addEventListener('pointerleave', leave);
  widget.addEventListener('focusout', blur);
  widget.addEventListener('keydown', key);
  list.addEventListener('click', choose);
  doc.addEventListener('click', outside);
  doc.addEventListener('toggle', update, true);
  doc.addEventListener('daysforth:history', update);
  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', schedule);
  desktop.addEventListener('change', update);
  rebuild();
  return () => {
    observer.disconnect();
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    rail.removeEventListener('click', clickRail);
    rail.removeEventListener('pointermove', move);
    rail.removeEventListener('pointerleave', clearPreview);
    rail.removeEventListener('focus', open);
    widget.removeEventListener('pointerenter', open);
    widget.removeEventListener('pointerleave', leave);
    widget.removeEventListener('focusout', blur);
    widget.removeEventListener('keydown', key);
    list.removeEventListener('click', choose);
    doc.removeEventListener('click', outside);
    doc.removeEventListener('toggle', update, true);
    doc.removeEventListener('daysforth:history', update);
    win.removeEventListener('scroll', schedule);
    win.removeEventListener('resize', schedule);
    desktop.removeEventListener('change', update);
    widget.hidden = true;
    close();
  };
}
