/**
 * Purpose: Date, chronology, and URL regression tests for Daysforth.
 * Scope: Real calendar dates, month-only precision, stable same-month order, pins, filters, and periods.
 * Does NOT belong: Browser event handling or image rendering.
 */
import { describe, expect, it } from 'vitest';
import { timelinePosts, timelineProfile } from '../../src/data/timeline';
import {
  MONTHS,
  dateLabel,
  fullDateLabel,
  isTimelineDate,
  monthAt,
  monthIndex,
  periodKey,
  periodLabel,
} from '../../src/lib/timeline-dates';
import {
  chronological,
  groupMoments,
  nearestMoment,
  readTimelineState,
  stateSearch,
} from '../../src/lib/timeline-model';
import { railStyles } from '../../src/lib/timeline-rail';

describe('approved timeline content', () => {
  it('publishes every approved moment with real month precision and unique IDs', () => {
    expect(timelinePosts).toHaveLength(17);
    expect(new Set(timelinePosts.map((post) => post.id)).size).toBe(17);
    expect(timelinePosts.every((post) => isTimelineDate(post.date))).toBe(true);
    expect(timelineProfile.handle).toBe('carsonmcrae');
    expect(timelineProfile.bio).toContain('complicated things');
    expect(timelineProfile.afterHours).toContain('PicPledge');
  });
  it('uses only the three confirmed pins and all six newly confirmed months', () => {
    expect(timelinePosts.filter((post) => post.pinned).map((post) => post.date)).toEqual([
      '1999-11',
      '2022-05',
      '2026-10',
    ]);
    const dates = Object.fromEntries(timelinePosts.map((post) => [post.id, post.date]));
    expect(dates).toMatchObject({
      'first-pc': '2015-12',
      'started-vanderbilt': '2018-08',
      infoworks: '2021-06',
      'joined-booz-allen': '2022-09',
      'margot-arrives': '2022-07',
      'quinn-arrives': '2023-07',
    });
  });
});
describe('date precision', () => {
  it.each(['1999-11', '2026-10', '2024-02-29', '2026-10-19'])('accepts %s', (date) =>
    expect(isTimelineDate(date)).toBe(true),
  );
  it.each([
    '1999',
    '2026-00',
    '2026-13',
    '2025-02-29',
    '2026-04-31',
    '2026-10-00',
    '2026-10-32',
    '2026-1',
    '2026-10-19Z',
  ])('rejects %s', (date) => expect(isTimelineDate(date)).toBe(false));
  it('round-trips every month across the full profile range', () => {
    for (let index = monthIndex('1999-11'); index <= monthIndex('2026-11'); index++)
      expect(monthIndex(monthAt(index))).toBe(index);
    expect(MONTHS).toHaveLength(12);
    expect(dateLabel('1999-11')).toBe('November 1999');
    expect(dateLabel('2022-05', true)).toBe('May 2022');
    expect(dateLabel('2026-10', true)).toBe('Oct 2026');
    expect(fullDateLabel('2026-10')).toBe('October 2026');
    expect(fullDateLabel('2026-10-19')).toBe('October 19, 2026');
  });
  it('labels years, quarters, and months without changing actual dates', () => {
    expect(periodKey('2026-10-19', 'years')).toBe('2026');
    expect(periodKey('2026-10-19', 'quarters')).toBe('2026-Q4');
    expect(periodKey('2026-10-19', 'months')).toBe('2026-10');
    expect(periodLabel('2026-10', 'years')).toBe('2026');
    expect(periodLabel('2026-10', 'quarters')).toBe('Q4 2026');
    expect(periodLabel('2026-10', 'months')).toBe('October 2026');
  });
});
describe('chronology and discovery', () => {
  it('sorts newest first, gives same-month milestones prominence, and leaves source content unchanged', () => {
    const ordered = chronological(timelinePosts);
    expect(ordered[0]!.id).toBe('built-daysforth');
    expect(ordered.at(-1)!.id).toBe('born');
    expect(
      ordered.filter((post) => post.date.startsWith('2026-10')).map((post) => post.id),
    ).toEqual(['married-nicole', 'ttsnative-1', 'picpledge-wedding']);
    expect(timelinePosts[0]!.id).toBe('born');
  });
  it('always keeps milestones when a category is selected', () => {
    const work = groupMoments(
      timelinePosts.filter((post) => post.category === 'Work' || post.milestone),
      'months',
    );
    expect(work.flatMap((group) => group.items).map((post) => post.id)).toContain('born');
    expect(visible('Work').map((post) => post.id)).toEqual(
      expect.arrayContaining([
        'born',
        'married-nicole',
        'vanderbilt-graduation',
        'infoworks',
        'joined-booz-allen',
      ]),
    );
    expect(visible('All')).toHaveLength(17);
    expect(visible('Projects').some((post) => post.id === 'margot-arrives')).toBe(false);
  });
  it('clusters matching periods and finds nearest dates including empty input', () => {
    const months = groupMoments(timelinePosts, 'months');
    expect(months.find((group) => group.key === '2026-10')!.items).toHaveLength(3);
    expect(
      groupMoments(timelinePosts, 'quarters').find((group) => group.key === '2026-Q4')!.items,
    ).toHaveLength(4);
    expect(groupMoments(timelinePosts, 'years')[0]!.items).toHaveLength(8);
    expect(groupMoments([], 'months')).toEqual([]);
    expect(nearestMoment([], '2020-01')).toBeUndefined();
    expect(nearestMoment(timelinePosts, '2019-01')!.id).toBe('started-vanderbilt');
  });
});
import { visibleMoments as visibleFrom } from '../../src/lib/timeline-model';
const visible = (category: Parameters<typeof visibleFrom>[1]) =>
  visibleFrom(timelinePosts, category);

describe('shareable browsing state', () => {
  it('uses safe defaults for absent or invalid parameters', () => {
    const expected = { view: 'timeline', category: 'All', detail: 'months', date: '2026-11' };
    expect(readTimelineState('', '2026-11')).toEqual(expected);
    expect(readTimelineState('?view=x&category=x&detail=x&date=2026-13', '2026-11')).toEqual(
      expected,
    );
    expect(readTimelineState('?date=', '2026-11')).toEqual(expected);
  });
  it.each(['Work', 'Projects', 'Life'])(
    'round-trips %s with presentation and date retained',
    (category) => {
      const state = readTimelineState(
        `?view=posts&category=${category}&detail=quarters&date=2026-10-19`,
        '2026-11',
      );
      expect(state).toEqual({ view: 'posts', category, detail: 'quarters', date: '2026-10' });
      expect(readTimelineState(stateSearch(state), '1999-11')).toEqual(state);
      expect(readTimelineState('?detail=years', '2026-11').detail).toBe('years');
    },
  );
  it('positions the pins by elapsed months and safely handles a single-month range', () => {
    const css = railStyles(['1999-11', '2022-05', '2026-10'], '1999-11', '2026-11');
    expect(css).toContain('0.00000%');
    expect(css).toContain('83.33333%');
    expect(css).toContain('99.69136%');
    expect(railStyles(['2026-10'], '2026-10', '2026-10')).not.toContain('NaN');
    expect(railStyles(['2026-10'], '2026-10', '2026-10', 'moment-')).toContain('.moment-0');
  });
});
