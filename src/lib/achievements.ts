/**
 * Purpose: A one-time "achievement unlocked" notice for visitors who explore every page.
 * Scope: Records visited page ids in this browser's localStorage, decides when the set is
 *   complete, and shows, auto-dismisses (after 8 seconds, paused on hover or focus), and closes
 *   the notice.
 * Constraints: Progress never leaves the browser; nothing is sent anywhere.
 * Does NOT belong: Notice markup and styling (src/components/AchievementToast.astro).
 */
import { readItem, safeStorage, writeItem, type StorageLike } from './storage';

export const VISITED_KEY = 'cm:visited-pages';
export const UNLOCKED_KEY = 'cm:completionist';

export function parseVisited(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export interface VisitResult {
  visited: string[];
  unlockedNow: boolean;
}

export function recordVisit(
  storage: StorageLike | null,
  pageId: string,
  allPages: readonly string[],
): VisitResult {
  const visited = new Set(parseVisited(readItem(storage, VISITED_KEY)));
  if (allPages.includes(pageId)) {
    visited.add(pageId);
  }
  const ordered = allPages.filter((page) => visited.has(page));
  if (!writeItem(storage, VISITED_KEY, JSON.stringify(ordered))) {
    return { visited: ordered, unlockedNow: false };
  }
  const complete = allPages.length > 0 && ordered.length === allPages.length;
  const alreadyUnlocked = readItem(storage, UNLOCKED_KEY) === 'true';
  if (complete && !alreadyUnlocked) {
    writeItem(storage, UNLOCKED_KEY, 'true');
    return { visited: ordered, unlockedNow: true };
  }
  return { visited: ordered, unlockedNow: false };
}

type AchievementWindow = Pick<Window, 'localStorage' | 'setTimeout' | 'clearTimeout'>;

/**
 * Markup contract: <body data-page-id="about" data-all-pages="home,about,...">
 * and a toast with `[data-achievement]` (initially `hidden`) containing a
 * `[data-achievement-close]` button.
 */
export function initAchievements(
  doc: Document,
  win: AchievementWindow,
  { autoHideMs = 8000 }: { autoHideMs?: number } = {},
): boolean {
  const pageId = doc.body.dataset['pageId'];
  const allPages = (doc.body.dataset['allPages'] ?? '').split(',').filter(Boolean);
  const toast = doc.querySelector<HTMLElement>('[data-achievement]');
  if (!pageId || !toast || allPages.length === 0) {
    return false;
  }

  const { unlockedNow } = recordVisit(safeStorage(win), pageId, allPages);
  if (!unlockedNow) {
    return false;
  }

  let timer: number | undefined;
  const hide = () => {
    win.clearTimeout(timer);
    toast.hidden = true;
  };
  const schedule = () => {
    win.clearTimeout(timer);
    timer = win.setTimeout(hide, autoHideMs);
  };
  const pause = () => win.clearTimeout(timer);

  toast.querySelector('[data-achievement-close]')?.addEventListener('click', hide);
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('mouseleave', schedule);
  toast.addEventListener('focusout', schedule);

  toast.hidden = false;
  schedule();
  return true;
}
