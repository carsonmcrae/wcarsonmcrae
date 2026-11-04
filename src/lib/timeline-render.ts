/**
 * Purpose: Reuses server-rendered cards when a visitor changes timeline presentation.
 * Scope: Reads trusted card metadata, groups visible cards, and exposes expandable period clusters.
 * Does NOT belong: URL state, events, content, or social actions.
 */
import { groupMoments, visibleMoments, type Moment, type TimelineState } from './timeline-model';
export interface MomentCard extends Moment {
  element: HTMLElement;
}

export function readMomentCards(root: ParentNode): MomentCard[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-moment]'), (element) => ({
    element,
    id: element.dataset['moment']!,
    date: element.dataset['date']!,
    category: element.dataset['category'] as Moment['category'],
    milestone: element.dataset['milestone'] === 'true',
  }));
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
    body.className = 'moment-group__cards';
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
