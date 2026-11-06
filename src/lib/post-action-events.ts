/**
 * Purpose: Handle explicit Save, Copy, and permanent-reaction actions on intent.
 * Scope: Semantic command activation, consent-aware persistence, permanent votes, and honest feedback.
 * Does NOT belong: Initial count hydration or backend rate limiting.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { createReactionController } from './reaction-controller';
import type { ReactionKind } from '../data/reactions';
import { readItem, writeItem, safeStorage } from './storage';
import { consentChoice } from './consent';
import { withBase } from './paths';
import type { ActionWindow, initPostActions } from './post-actions';
export function attachPostActionEvents(
  doc: Document,
  win: ActionWindow,
  endpoint: string,
  state: ReturnType<typeof initPostActions>,
  announce: (message: string) => void,
) {
  const { storage, changed, updateCounts } = state;
  const reactions = createReactionController(win, endpoint, storage);
  state.useReactionChoices(reactions.hasReacted);
  let alive = true;
  const save = (button: HTMLButtonElement, id: string) => {
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
  };
  const copy = async (row: HTMLElement) => {
    const path = row.dataset['postUrl'] ?? withBase(`/posts/${row.dataset['postActions']!}/`);
    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    const url = new URL(path, canonical ?? win.location.origin).href;
    try {
      if (!win.navigator.clipboard) throw new Error('Clipboard unavailable');
      await win.navigator.clipboard.writeText(url);
      if (alive) announce('Link copied.');
    } catch {
      if (alive) announce(`Copy this link: ${url}`);
    }
  };
  const react = async (button: HTMLButtonElement, id: string) => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    button.disabled = true;
    const kind = (button.dataset['react'] || 'heart') as ReactionKind;
    const pending = reactions.react(id, kind);
    const visitor = readItem(storage, 'daysforth.visitor');
    const result = await pending;
    if (!alive) return;
    if (result.status === 'added') {
      changed.add(result.key);
      updateCounts({ [result.key]: result.count });
    }
    const remembered = reactions.hasReacted(id, kind);
    button.setAttribute('aria-pressed', String(remembered));
    button.disabled = remembered;
    if (visitor !== readItem(storage, 'daysforth.visitor')) return;
    if (result.status === 'added') announce('Reaction added. It stays with this moment.');
    else if (result.status !== 'duplicate') {
      const messages = {
        unavailable: 'Reactions are unavailable right now. Please try again later.',
        storage: 'Reactions need browser storage to prevent duplicate votes.',
        failed: 'Your reaction couldn’t be saved. Please try again.',
      };
      announce(messages[result.status]);
    }
  };
  const activate = async (target: Element) => {
    if (!alive) return;
    const button = target.closest<HTMLButtonElement>('[data-post-actions] button');
    if (!button || button.matches(':disabled')) return;
    const row = button.closest<HTMLElement>('[data-post-actions]')!;
    const id = row.dataset['postActions']!;
    if (button.dataset['save'] !== undefined) save(button, id);
    if (button.dataset['copy'] !== undefined) await copy(row);
    if (button.dataset['react'] !== undefined) await react(button, id);
  };
  const onClick = (event: MouseEvent) => {
    if (event.target instanceof Element) void activate(event.target);
  };

  doc.addEventListener('click', onClick);
  return {
    activate,
    destroy: () => {
      alive = false;
      doc.removeEventListener('click', onClick);
    },
  };
}
