/**
 * Purpose: Handle explicit Save, Copy, and permanent-reaction actions on intent.
 * Scope: Consent-aware persistence, idempotent POST votes, and honest feedback.
 * Does NOT belong: Initial count hydration or backend rate limiting.
 */
import { submitReaction } from './reaction-api';
import { reactionKey } from './reaction-keys';
import type { ReactionKind } from '../data/reactions';
import { readItem, writeItem, safeStorage, type StorageLike } from './storage';
import { consentChoice } from './consent';
import type { ActionWindow, initPostActions } from './post-actions';
function visitorIdentity(storage: StorageLike | null, randomId: () => string): string | null {
  const existing = readItem(storage, 'daysforth.visitor');
  if (existing && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(existing)) return existing;
  const id = randomId();
  return writeItem(storage, 'daysforth.visitor', id) ? id : null;
}

export function attachPostActionEvents(
  doc: Document,
  win: ActionWindow,
  endpoint: string,
  state: ReturnType<typeof initPostActions>,
  announce: (message: string) => void,
) {
  const { storage, changed, updateCounts } = state;
  const identity = () => visitorIdentity(storage, () => win.crypto.randomUUID());
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
      const permission = consentChoice(safeStorage(win));
      let message = 'Removed from saved moments.';
      if (saved)
        message =
          permission === true
            ? 'Saved in this browser.'
            : 'Saved for this page. Allow storage to keep it between visits.';
      announce(message);
      if (saved && permission === null)
        doc.dispatchEvent(new CustomEvent('daysforth:privacy-request'));
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
      if (button.getAttribute('aria-pressed') === 'true') return;
      if (!endpoint) {
        announce('Reactions are unavailable right now. Please try again later.');
        return;
      }
      const visitorId = identity();
      if (!visitorId) {
        announce('Reactions need browser storage to prevent duplicate votes.');
        return;
      }
      const key = reactionKey(id, (button.dataset['react'] || 'heart') as ReactionKind);
      button.disabled = true;
      try {
        const count = await submitReaction(endpoint, key, visitorId, win.fetch);
        changed.add(key);
        updateCounts({ [key]: count });
        button.setAttribute('aria-pressed', 'true');
        writeItem(storage, `daysforth.reacted.${key}`, 'true');
        announce('Reaction added. It stays with this moment.');
      } catch {
        announce('Your reaction couldn’t be saved. Please try again.');
      } finally {
        button.disabled = button.getAttribute('aria-pressed') === 'true';
      }
    }
  };

  doc.addEventListener('click', onClick);
  return () => doc.removeEventListener('click', onClick);
}
