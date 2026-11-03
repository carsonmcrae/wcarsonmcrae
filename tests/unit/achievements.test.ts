/**
 * Purpose: Unit tests for src/lib/achievements.ts.
 * Scope: Visit tracking, one-time unlocking, storage failures, and the notice's timing, pausing,
 *   and dismissal.
 * Does NOT belong: Browser checks of the real notice (tests/e2e).
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UNLOCKED_KEY,
  VISITED_KEY,
  initAchievements,
  parseVisited,
  recordVisit,
} from '../../src/lib/achievements';
import { memoryStorage, throwingStorage } from './helpers';

const ALL = ['home', 'about', 'work', 'life', 'contact'];

describe('parseVisited', () => {
  it('handles empty, invalid, and mixed values', () => {
    expect(parseVisited(null)).toEqual([]);
    expect(parseVisited('not json')).toEqual([]);
    expect(parseVisited('{"a":1}')).toEqual([]);
    expect(parseVisited('["home", 3, "about"]')).toEqual(['home', 'about']);
  });
});

describe('recordVisit', () => {
  it('tracks pages in a stable order and unlocks once', () => {
    const storage = memoryStorage();
    for (const page of ['work', 'home', 'life', 'about']) {
      expect(recordVisit(storage, page, ALL).unlockedNow).toBe(false);
    }
    expect(JSON.parse(storage.getItem(VISITED_KEY)!)).toEqual(['home', 'about', 'work', 'life']);

    const final = recordVisit(storage, 'contact', ALL);
    expect(final).toEqual({ visited: ALL, unlockedNow: true });
    expect(storage.getItem(UNLOCKED_KEY)).toBe('true');

    expect(recordVisit(storage, 'home', ALL).unlockedNow).toBe(false);
  });

  it('ignores pages outside the tracked list', () => {
    const storage = memoryStorage();
    expect(recordVisit(storage, '404', ALL).visited).toEqual([]);
  });

  it('never unlocks for an empty page list', () => {
    expect(recordVisit(memoryStorage(), 'home', []).unlockedNow).toBe(false);
  });

  it('does nothing when storage is unavailable', () => {
    expect(recordVisit(null, 'home', ['home'])).toEqual({ visited: ['home'], unlockedNow: false });
    expect(recordVisit(throwingStorage(), 'home', ['home']).unlockedNow).toBe(false);
  });
});

function setupPage(pageId: string, allPages = ALL.join(',')) {
  document.body.dataset['pageId'] = pageId;
  document.body.dataset['allPages'] = allPages;
  document.body.innerHTML = `
    <div data-achievement hidden>
      <p>Unlocked</p>
      <button type="button" data-achievement-close>Close</button>
    </div>`;
  return document.querySelector<HTMLElement>('[data-achievement]')!;
}

describe('initAchievements', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    delete document.body.dataset['pageId'];
    delete document.body.dataset['allPages'];
  });

  it('shows the toast when the last page is visited, then auto-hides', () => {
    vi.useFakeTimers();
    const storage = memoryStorage({ [VISITED_KEY]: JSON.stringify(ALL.slice(0, 4)) });
    const toast = setupPage('contact');
    const shown = initAchievements(
      document,
      { localStorage: storage, setTimeout, clearTimeout },
      { autoHideMs: 1000 },
    );
    expect(shown).toBe(true);
    expect(toast.hidden).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(toast.hidden).toBe(true);
  });

  it('pauses while hovered or focused and can be dismissed', () => {
    vi.useFakeTimers();
    const storage = memoryStorage({ [VISITED_KEY]: JSON.stringify(ALL.slice(1)) });
    const toast = setupPage('home');
    initAchievements(
      document,
      { localStorage: storage, setTimeout, clearTimeout },
      { autoHideMs: 500 },
    );

    toast.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(2000);
    expect(toast.hidden).toBe(false);

    toast.dispatchEvent(new Event('mouseleave'));
    toast.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(2000);
    expect(toast.hidden).toBe(false);

    toast.dispatchEvent(new Event('focusout'));
    toast.querySelector<HTMLButtonElement>('[data-achievement-close]')!.click();
    expect(toast.hidden).toBe(true);
  });

  it('uses a sensible default delay', () => {
    vi.useFakeTimers();
    const storage = memoryStorage({ [VISITED_KEY]: JSON.stringify(ALL.slice(1)) });
    const toast = setupPage('home');
    initAchievements(document, { localStorage: storage, setTimeout, clearTimeout });
    vi.advanceTimersByTime(7999);
    expect(toast.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(toast.hidden).toBe(true);
  });

  it('stays hidden before every page has been visited', () => {
    const toast = setupPage('home');
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(false);
    expect(toast.hidden).toBe(true);
  });

  it('does nothing when the page is not set up for it', () => {
    setupPage('home');
    delete document.body.dataset['allPages'];
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(false);
    setupPage('home', '');
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(false);
    delete document.body.dataset['pageId'];
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(false);
    document.body.dataset['pageId'] = 'home';
    document.body.dataset['allPages'] = 'home';
    document.body.innerHTML = '';
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(false);
  });

  it('works when the toast has no close button', () => {
    document.body.dataset['pageId'] = 'home';
    document.body.dataset['allPages'] = 'home';
    document.body.innerHTML = '<div data-achievement hidden></div>';
    expect(
      initAchievements(document, { localStorage: memoryStorage(), setTimeout, clearTimeout }),
    ).toBe(true);
  });
});
