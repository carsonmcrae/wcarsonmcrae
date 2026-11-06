/**
 * Purpose: Hydrate remembered choices before timeline filtering without loading network operations.
 * Scope: Action-template expansion, saved/reaction flags, consent changes, and BFCache choice refresh.
 * Does NOT belong: Shared counts, mutation commands, or network requests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { fillActionRows } from './action-template';
import { hasStoredReaction } from './reaction-choice';
import type { ReactionKind } from '../data/reactions';
import { migrateSavedMoments } from './saved-moments';
import { readItem, safeStorage } from './storage';
import { preferenceStorage, consentChoice } from './consent';
import type { ActionWindow } from './post-actions';

export function initActionChoices(doc: Document, win: ActionWindow) {
  fillActionRows(doc);
  const storage = preferenceStorage(win);
  let hasReacted = (id: string, kind: ReactionKind) => hasStoredReaction(storage, id, kind);
  const rows = Array.from(doc.querySelectorAll<HTMLElement>('[data-post-actions]'));
  const refresh = () => {
    if (consentChoice(safeStorage(win)) === true) migrateSavedMoments(storage);
    for (const row of rows) {
      const id = row.dataset['postActions']!;
      const saved = readItem(storage, `daysforth.saved.${id}`) === 'true';
      row.querySelector('[data-save]')!.setAttribute('aria-pressed', String(saved));
      row.querySelector('[data-save-label]')!.textContent = saved ? 'Saved' : 'Save';
      for (const button of row.querySelectorAll<HTMLButtonElement>('[data-react]')) {
        const reacted = hasReacted(id, (button.dataset['react'] || 'heart') as ReactionKind);
        button.setAttribute('aria-pressed', String(reacted));
        button.disabled = reacted;
      }
    }
  };
  const onStorage = () => {
    refresh();
    doc.dispatchEvent(new CustomEvent('daysforth:saved'));
  };
  const onResume = (event: PageTransitionEvent) => {
    if (event.persisted) onStorage();
  };
  refresh();
  doc.addEventListener('daysforth:storage', onStorage);
  win.addEventListener('pageshow', onResume);
  return {
    storage,
    rows,
    useReactionChoices: (read: typeof hasReacted) => {
      hasReacted = read;
    },
    destroy: () => {
      doc.removeEventListener('daysforth:storage', onStorage);
      win.removeEventListener('pageshow', onResume);
    },
  };
}
