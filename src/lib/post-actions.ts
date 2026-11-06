/**
 * Purpose: Restore saved choices and display shared counts before any interaction.
 * Scope: Action markup, consent-aware hydration, cache restoration, and shared update state.
 * Does NOT belong: Lazy mutation or clipboard events (post-action-events.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { loadReactionCounts } from './reaction-api';
import { initActionChoices } from './action-choices';
import { reactionKey } from './reaction-keys';
import type { ReactionKind } from '../data/reactions';
export interface ActionWindow {
  addEventListener: Window['addEventListener'];
  removeEventListener: Window['removeEventListener'];
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

export function initPostActions(
  doc: Document,
  win: ActionWindow,
  endpoint: string,
  choices = initActionChoices(doc, win),
) {
  const { storage, rows } = choices;
  const changed = new Set<string>();
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
  let request = 0;
  const refresh = () => {
    if (!endpoint || rows.length === 0) return;
    const current = ++request;
    changed.clear();
    void loadReactionCounts(endpoint, win.fetch)
      .then((counts) => {
        if (current === request) updateCounts(counts, true);
      })
      .catch(() => {
        if (current !== request) return;
        for (const row of rows)
          for (const button of row.querySelectorAll('[data-react]'))
            button.setAttribute('title', 'Reactions temporarily unavailable');
      });
  };
  const onResume = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    refresh();
  };
  refresh();
  win.addEventListener('pageshow', onResume);
  return {
    storage,
    useReactionChoices: choices.useReactionChoices,
    changed,
    updateCounts,
    destroy: () => {
      request++;
      choices.destroy();
      win.removeEventListener('pageshow', onResume);
    },
  };
}
