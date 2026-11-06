/**
 * Purpose: The pure browsing model shared by server rendering and the interactive feed.
 * Scope: Stable chronology, filtering with persistent milestones, grouping, URL state, and nearest dates.
 * Does NOT belong: Browser events, DOM rendering, or storage.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { Category } from '../data/timeline';
import {
  isTimelineDate,
  monthIndex,
  periodKey,
  periodLabel,
  type DateDetail,
} from './timeline-dates';

export interface Moment {
  id: string;
  date: string;
  category: Category;
  milestone?: boolean;
  saved?: boolean;
}
export interface TimelineState {
  view: 'timeline' | 'posts';
  category: 'All' | 'Milestones' | 'Saved' | Category;
  detail: DateDetail;
  date: string;
}
export interface MomentGroup<T> {
  key: string;
  label: string;
  date: string;
  items: T[];
}

export function chronological<T extends Moment>(posts: T[]): T[] {
  return posts.toSorted(
    (a, b) =>
      monthIndex(b.date) - monthIndex(a.date) ||
      Number(Boolean(b.milestone)) - Number(Boolean(a.milestone)),
  );
}

export function visibleMoments<T extends Moment>(
  posts: T[],
  category: TimelineState['category'],
): T[] {
  return chronological(
    posts.filter((post) => {
      if (category === 'Milestones') return Boolean(post.milestone);
      if (category === 'Saved') return Boolean(post.saved);
      return category === 'All' || post.category === category || post.milestone;
    }),
  );
}

export function groupMoments<T extends Moment>(posts: T[], detail: DateDetail): MomentGroup<T>[] {
  const groups = new Map<string, MomentGroup<T>>();
  for (const post of chronological(posts)) {
    const key = periodKey(post.date, detail);
    const group = groups.get(key);
    if (group) group.items.push(post);
    else
      groups.set(key, {
        key,
        label: periodLabel(post.date, detail),
        date: post.date.slice(0, 7),
        items: [post],
      });
  }
  return [...groups.values()];
}

export function nearestMoment<T extends Moment>(posts: T[], date: string): T | undefined {
  return chronological(posts).toSorted(
    (a, b) =>
      Math.abs(monthIndex(a.date) - monthIndex(date)) -
      Math.abs(monthIndex(b.date) - monthIndex(date)),
  )[0];
}

export function readTimelineState(search: string, latest: string): TimelineState {
  const params = new URLSearchParams(search);
  const category = params.get('category');
  const detail = params.get('detail');
  const date = params.get('date');
  return {
    view: params.get('view') === 'posts' ? 'posts' : 'timeline',
    category:
      category === 'Work' ||
      category === 'Projects' ||
      category === 'Life' ||
      category === 'Milestones' ||
      category === 'Saved'
        ? category
        : 'All',
    detail: detail === 'years' || detail === 'quarters' ? detail : 'months',
    date: date && isTimelineDate(date) ? date.slice(0, 7) : latest.slice(0, 7),
  };
}

export function stateSearch(state: TimelineState): string {
  return new URLSearchParams({
    view: state.view,
    category: state.category,
    detail: state.detail,
    date: state.date,
  }).toString();
}

export function momentHref(
  currentHref: string,
  moment: Pick<Moment, 'id' | 'date'>,
  state?: TimelineState,
): string {
  const url = new URL(currentHref);
  if (state) url.search = stateSearch(state);
  url.searchParams.set('date', moment.date.slice(0, 7));
  url.hash = `moment-${moment.id}`;
  return url.href;
}
