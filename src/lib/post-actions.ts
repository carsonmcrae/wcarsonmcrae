/**
 * Purpose: Working social actions shared by feed cards and post permalinks.
 * Scope: Local Save, canonical Copy link, shared reactions, and failure feedback without fake totals.
 * Constraints: Only a successful server vote marks a reaction; unavailable storage never fabricates persistence.
 * Does NOT belong: Notice timing, API validation, or backend rate limiting.
 */
import { loadReactionCounts, submitReaction } from './reaction-api';
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

export function initPostActions(
  doc: Document,
  win: ActionWindow,
  endpoint: string,
  announce: (message: string) => void,
) {
  const storage = safeStorage(win);
  const rows = Array.from(doc.querySelectorAll<HTMLElement>('[data-post-actions]'));
  const identity = () => visitorIdentity(storage, () => win.crypto.randomUUID());
  for (const row of rows) {
    const id = row.dataset['postActions']!;
    const saved = readItem(storage, `daysforth.saved.${id}`) === 'true';
    row.querySelector('[data-save]')!.setAttribute('aria-pressed', String(saved));
    row.querySelector('[data-save-label]')!.textContent = saved ? 'Saved' : 'Save';
    row
      .querySelector('[data-react]')!
      .setAttribute(
        'aria-pressed',
        String(readItem(storage, `daysforth.reacted.${id}`) === 'true'),
      );
  }
  const updateCounts = (counts: Record<string, number>) => {
    for (const row of rows) {
      const count = counts[row.dataset['postActions']!];
      if (count !== undefined) {
        const label = row.querySelector('[data-reaction-count]')!;
        label.textContent = String(Math.max(count, Number(label.textContent) || 0));
        row
          .querySelector('[data-react]')!
          .setAttribute(
            'aria-label',
            `React to ${row.dataset['postTitle']!}. Reactions: ${label.textContent}.`,
          );
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
      if (button.getAttribute('aria-pressed') === 'true') {
        announce('You’ve already reacted to this moment.');
        return;
      }
      const visitorId = identity();
      if (!visitorId) {
        announce('Reactions need browser storage to prevent duplicate votes.');
        return;
      }
      button.disabled = true;
      try {
        const count = await submitReaction(endpoint, id, visitorId, win.fetch);
        updateCounts({ [id]: count });
        button.setAttribute('aria-pressed', 'true');
        writeItem(storage, `daysforth.reacted.${id}`, 'true');
        announce('Reaction added.');
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
      .then(updateCounts)
      .catch(() => {
        for (const row of rows)
          row
            .querySelector('[data-react]')!
            .setAttribute('title', 'Reactions temporarily unavailable');
      });
  }
  return () => doc.removeEventListener('click', onClick);
}
