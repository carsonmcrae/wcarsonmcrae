/**
 * Purpose: Restore saved choices and display shared counts before any interaction.
 * Scope: Action markup, consent-aware hydration, initial fetch, and shared update state.
 * Does NOT belong: Lazy mutation or clipboard events (post-action-events.ts).
 */
import { loadReactionCounts } from './reaction-api';
import { reactionKey } from './reaction-keys';
import { fillActionRows } from './action-template';
import type { ReactionKind } from '../data/reactions';
import { migrateSavedMoments } from './saved-moments';
import { readItem, safeStorage } from './storage';
import { preferenceStorage, consentChoice } from './consent';
export interface ActionWindow {
  localStorage: Storage;
  location: Pick<Location, 'origin'>;
  navigator: { clipboard?: Pick<Clipboard, 'writeText'> };
  crypto: Pick<Crypto, 'randomUUID'>;
  fetch: typeof fetch;
}

function buttonKey(row: HTMLElement, button: HTMLButtonElement) {
  return reactionKey(
    row.dataset['postActions']!,
    (button.dataset['react'] || 'heart') as ReactionKind,
  );
}

export function initPostActions(doc: Document, win: ActionWindow, endpoint: string) {
  fillActionRows(doc);
  const storage = preferenceStorage(win);
  const rows = Array.from(doc.querySelectorAll<HTMLElement>('[data-post-actions]'));
  const changed = new Set<string>();
  const syncChoices = () => {
    if (consentChoice(safeStorage(win)) === true) migrateSavedMoments(storage);
    for (const row of rows) {
      const id = row.dataset['postActions']!;
      const saved = readItem(storage, `daysforth.saved.${id}`) === 'true';
      row.querySelector('[data-save]')!.setAttribute('aria-pressed', String(saved));
      row.querySelector('[data-save-label]')!.textContent = saved ? 'Saved' : 'Save';
      for (const button of row.querySelectorAll<HTMLButtonElement>('[data-react]')) {
        button.setAttribute(
          'aria-pressed',
          String(readItem(storage, `daysforth.reacted.${buttonKey(row, button)}`) === 'true'),
        );
        button.disabled = button.getAttribute('aria-pressed') === 'true';
      }
    }
  };
  const onStorage = () => {
    syncChoices();
    doc.dispatchEvent(new CustomEvent('daysforth:saved'));
  };
  syncChoices();
  doc.addEventListener('daysforth:storage', onStorage);
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
  if (endpoint && rows.length > 0) {
    void loadReactionCounts(endpoint, win.fetch)
      .then((counts) => updateCounts(counts, true))
      .catch(() => {
        for (const row of rows)
          for (const button of row.querySelectorAll('[data-react]'))
            button.setAttribute('title', 'Reactions temporarily unavailable');
      });
  }
  return {
    storage,
    changed,
    updateCounts,
    destroy: () => doc.removeEventListener('daysforth:storage', onStorage),
  };
}
