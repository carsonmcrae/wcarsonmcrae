/**
 * Purpose: Browse live timeline cards through a compact desktop rail and preview list.
 * Scope: Rendered-card metadata, active geometry, passive ticks, keyboard previews, and cleanup.
 * Does NOT belong: Filtering, date/history state, or persistent preferences.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { dateLabel } from './timeline-dates';
import { readTimelineViewport } from './timeline-viewport';
type NavigatorWindow = Pick<
  Window,
  'innerHeight' | 'matchMedia' | 'addEventListener' | 'removeEventListener'
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
  let cards: HTMLElement[] = [];
  let links: HTMLAnchorElement[] = [];
  let ticks: HTMLElement[] = [];
  let active = 0;
  const clearPreview = () => {
    for (const element of [...links, ...ticks]) delete element.dataset['preview'];
  };
  const close = () => {
    panel.hidden = true;
    rail.setAttribute('aria-expanded', 'false');
    clearPreview();
  };
  const open = () => {
    if (widget.hidden) return;
    panel.hidden = false;
    rail.setAttribute('aria-expanded', 'true');
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
  const update = () => {
    const viewport = readTimelineViewport(root, win);
    widget.hidden =
      !desktop.matches ||
      root.dataset['view'] !== 'timeline' ||
      !viewport.inside ||
      cards.length === 0;
    if (widget.hidden) {
      close();
      return;
    }
    active = cards.findIndex((card) => {
      const bounds = card.getBoundingClientRect();
      return bounds.bottom > viewport.readingTop && bounds.top < win.innerHeight;
    });
    links.forEach((link, index) => link.setAttribute('aria-current', String(index === active)));
    ticks.forEach((tick, index) => {
      tick.dataset['active'] = String(index === active);
    });
  };
  const rebuild = () => {
    cards = Array.from(groups.querySelectorAll<HTMLElement>('[data-moment]'));
    links = [];
    ticks = [];
    list.replaceChildren();
    tickList.replaceChildren();
    for (const card of cards) {
      const id = card.dataset['moment']!;
      const link = doc.createElement('a');
      link.href = `#moment-${id}`;
      link.dataset['jumpDate'] = card.dataset['date']!;
      link.dataset['jumpMoment'] = id;
      link.tabIndex = 0;
      const title = doc.createElement('strong');
      title.textContent = card.querySelector('h3')!.textContent.trim();
      const date = doc.createElement('span');
      date.textContent = dateLabel(card.dataset['date']!);
      link.append(title, date);
      const item = doc.createElement('li');
      item.append(link);
      list.append(item);
      const tick = doc.createElement('span');
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
    links.forEach((link, item) => {
      link.dataset['preview'] = String(item === index);
    });
    ticks.forEach((tick, item) => {
      tick.dataset['preview'] = String(item === index);
    });
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
  win.addEventListener('scroll', update, { passive: true });
  win.addEventListener('resize', update);
  desktop.addEventListener('change', update);
  rebuild();
  return () => {
    observer.disconnect();
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
    win.removeEventListener('scroll', update);
    win.removeEventListener('resize', update);
    desktop.removeEventListener('change', update);
    widget.hidden = true;
    close();
  };
}
