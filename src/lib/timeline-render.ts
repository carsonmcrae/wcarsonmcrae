/**
 * Purpose: Reuses server-rendered cards when a visitor changes timeline presentation.
 * Scope: Reads permanent card IDs and semantic dates, groups visible cards, and exposes period clusters.
 * Does NOT belong: URL state, events, content, or social actions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { groupMoments, visibleMoments, type Moment, type TimelineState } from './timeline-model';
import { periodKey } from './timeline-dates';
export interface MomentCard extends Moment {
  element: HTMLElement;
}

export function readMomentCards(root: ParentNode): MomentCard[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.post-card[id^="moment-"]'), (element) => ({
    element,
    id: element.id.slice('moment-'.length),
    date: element.querySelector('time')!.dateTime,
    category: element.dataset['category'] as Moment['category'],
    milestone: element.dataset['milestone'] === 'true',
    get saved() {
      return element.querySelector('[data-save]')?.getAttribute('aria-pressed') === 'true';
    },
  }));
}

/** Adopts the default monthly SSR presentation without detaching an active card descendant. */
export function adoptMomentGroups(container: HTMLElement): HTMLElement[] {
  const groups = Array.from(
    container.querySelectorAll<HTMLElement>('.moment-group--year .moment-group'),
  );
  if (groups.length === 0) throw new Error('Missing server-rendered monthly timeline groups');
  for (const group of groups) {
    const date = periodKey(group.querySelector('time')!.dateTime, 'months');
    group.dataset['period'] = date;
    group.dataset['periodDate'] = date;
  }
  return groups;
}

export function renderMomentGroups(
  doc: Document,
  container: HTMLElement,
  cards: MomentCard[],
  state: TimelineState,
): MomentCard[] {
  const visible = visibleMoments(cards, state.category);
  const sections = groupMoments(visible, state.detail).map((group) => {
    const section = doc.createElement('section');
    section.className = 'moment-group';
    section.dataset['period'] = group.key;
    section.dataset['periodDate'] = group.date;
    const heading = doc.createElement('h2');
    heading.tabIndex = -1;
    heading.textContent = group.label;
    section.append(heading);
    const body = doc.createElement('div');
    body.append(...group.items.map((post) => post.element));
    if (state.detail !== 'months' && group.items.length > 1) {
      const cluster = doc.createElement('details');
      cluster.className = 'moment-cluster';
      const summary = doc.createElement('summary');
      summary.textContent = `${group.items.length} moments · ${group.label}`;
      cluster.append(summary, body);
      section.append(cluster);
    } else section.append(body);
    return section;
  });
  container.replaceChildren(...sections);
  return visible;
}
