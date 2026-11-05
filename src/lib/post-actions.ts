/**
 * Purpose: Working social actions shared by feed cards and post permalinks.
 * Scope: Local Save, canonical Copy, independent shared reactions, removal, and honest failure feedback.
 * Constraints: Only server-confirmed votes affect totals; existing heart identities remain compatible.
 * Does NOT belong: Notice timing, API validation, or backend rate limiting.
 */
import { loadReactionCounts, submitReaction } from './reaction-api';
import { reactionKey } from './reaction-keys';
import { fillActionRows } from './action-template';
import type { ReactionKind } from '../data/reactions';
import { migrateSavedMoments } from './saved-moments';
import { readItem, safeStorage, writeItem, type StorageLike } from './storage';
interface ActionWindow {
  localStorage: Storage;
  location: Pick<Location, 'origin'>;
  navigator: { clipboard?: Pick<Clipboard, 'writeText'> };
  crypto: Pick<Crypto, 'randomUUID'>;
  fetch: typeof fetch;
}
function visitorIdentity(storage: StorageLike | null, randomId: () => string): string | null {
  const existing = readItem(storage, 'daysforth.visitor');
  if (existing && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(existing)) return existing;
  const id = randomId();
  return writeItem(storage, 'daysforth.visitor', id) ? id : null;
}
function buttonKey(row: HTMLElement, button: HTMLButtonElement) {
  return reactionKey(
    row.dataset['postActions']!,
    (button.dataset['react'] || 'heart') as ReactionKind,
  );
}
export function initPostActions(
  doc: Document,
  win: ActionWindow,
  endpoint: string,
  announce: (message: string) => void,
) {
  fillActionRows(doc);
  const storage = safeStorage(win);
  migrateSavedMoments(storage);
  const rows = Array.from(doc.querySelectorAll<HTMLElement>('[data-post-actions]'));
  const changed = new Set<string>();
  const identity = () => visitorIdentity(storage, () => win.crypto.randomUUID());
  for (const row of rows) {
    const id = row.dataset['postActions']!;
    const saved = readItem(storage, `daysforth.saved.${id}`) === 'true';
    row.querySelector('[data-save]')!.setAttribute('aria-pressed', String(saved));
    row.querySelector('[data-save-label]')!.textContent = saved ? 'Saved' : 'Save';
    for (const button of row.querySelectorAll<HTMLButtonElement>('[data-react]'))
      button.setAttribute(
        'aria-pressed',
        String(readItem(storage, `daysforth.reacted.${buttonKey(row, button)}`) === 'true'),
      );
  }
  const updateCounts = (counts: Record<string, number>, initial = false) => {
    for (const row of rows) {
      for (const button of row.querySelectorAll<HTMLButtonElement>('[data-react]')) {
        const key = buttonKey(row, button);
        const count = counts[key];
        if (count !== undefined && !(initial && changed.has(key))) {
          button.querySelector('[data-reaction-count]')!.textContent = String(count);
          button.setAttribute(
            'aria-label',
            `${button.dataset['reactionLabel'] ?? 'React to'} ${row.dataset['postTitle']!}. Reactions: ${count}.`,
          );
        }
      }
    }
  };
  const onClick = async (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('[data-post-actions] button');
    if (!button) return;
    const row = button.closest<HTMLElement>('[data-post-actions]')!;
    const id = row.dataset['postActions']!;
    if (button.hasAttribute('data-save')) {
      const saved = button.getAttribute('aria-pressed') !== 'true';
      if (!writeItem(storage, `daysforth.saved.${id}`, String(saved))) {
        announce('Your browser could not save this moment.');
        return;
      }
      button.setAttribute('aria-pressed', String(saved));
      button.querySelector('[data-save-label]')!.textContent = saved ? 'Saved' : 'Save';
      doc.dispatchEvent(new CustomEvent('daysforth:saved'));
      announce(saved ? 'Saved in this browser.' : 'Removed from saved moments.');
    }
    if (button.hasAttribute('data-copy')) {
      const url = new URL(row.dataset['postUrl']!, win.location.origin).href;
      try {
        if (!win.navigator.clipboard) throw new Error('Clipboard unavailable');
        await win.navigator.clipboard.writeText(url);
        announce('Link copied.');
      } catch {
        announce(`Copy this link: ${url}`);
      }
    }
    if (button.hasAttribute('data-react')) {
      if (!endpoint) {
        announce('Reactions are unavailable right now. Please try again later.');
        return;
      }
      const visitorId = identity();
      if (!visitorId) {
        announce('Reactions need browser storage to prevent duplicate votes.');
        return;
      }
      const remove = button.getAttribute('aria-pressed') === 'true';
      const key = buttonKey(row, button);
      button.disabled = true;
      try {
        const count = await submitReaction(endpoint, key, visitorId, win.fetch, remove);
        changed.add(key);
        updateCounts({ [key]: count });
        button.setAttribute('aria-pressed', String(!remove));
        writeItem(storage, `daysforth.reacted.${key}`, String(!remove));
        announce(remove ? 'Reaction removed.' : 'Reaction added.');
      } catch {
        announce('Your reaction couldn’t be saved. Please try again.');
      } finally {
        button.disabled = false;
      }
    }
  };
  doc.addEventListener('click', onClick);
  if (endpoint && rows.length > 0) {
    void loadReactionCounts(endpoint, win.fetch)
      .then((counts) => updateCounts(counts, true))
      .catch(() => {
        for (const row of rows)
          for (const button of row.querySelectorAll('[data-react]'))
            button.setAttribute('title', 'Reactions temporarily unavailable');
      });
  }
  return () => doc.removeEventListener('click', onClick);
}
