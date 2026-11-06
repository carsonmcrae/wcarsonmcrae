/**
 * Purpose: Give each enlarged photograph its own permanent shared reactions.
 * Scope: Selected-photo rendering, consent-aware choices, request races, and honest viewer feedback.
 * Does NOT belong: Reaction identity/network policy, album navigation, or post Save/Copy actions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { createReactionController } from './reaction-controller';
import { reactionKey } from './reaction-keys';
import { reactions, type ReactionKind } from '../data/reactions';

export function initPhotoReactionControls(
  dialog: HTMLDialogElement,
  win: Window,
  endpoint: string,
) {
  const root = dialog.querySelector<HTMLElement>('[data-photo-reactions]')!;
  const status = dialog.querySelector<HTMLElement>('[data-photo-reaction-status]')!;
  const controller = createReactionController(win, endpoint);
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-photo-react]')];
  const counts: Record<string, number> = {};
  const pending = new Set<string>();
  let selected = '';
  let alive = true;
  let request = 0;
  let loaded = false;
  const paint = () => {
    for (const button of buttons) {
      const kind = button.dataset['photoReact'] as ReactionKind;
      const count = counts[reactionKey(selected, kind)];
      const display = count === undefined ? '—' : String(count);
      const chosen = controller.hasReacted(selected, kind);
      const label = reactions.find((reaction) => reaction.id === kind)!.label;
      button.querySelector('[data-photo-reaction-count]')!.textContent = display;
      button.setAttribute(
        'aria-label',
        count === undefined
          ? `${label} ${display}. Photo reaction count unavailable.`
          : `${label} ${display}. React to this photo.`,
      );
      button.setAttribute('aria-pressed', String(chosen));
      button.disabled =
        !endpoint || !selected || chosen || pending.has(reactionKey(selected, kind));
    }
  };
  const refresh = () => {
    if (!endpoint) return;
    const generation = ++request;
    void controller
      .load()
      .then((next) => {
        if (!alive || generation !== request) return;
        for (const [key, count] of Object.entries(next))
          counts[key] = Math.max(counts[key] ?? 0, count);
        paint();
      })
      .catch(() => {
        if (alive && generation === request)
          status.textContent = 'Photo reaction counts are temporarily unavailable.';
      });
  };
  const click = async (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('[data-photo-react]');
    if (!button || button.disabled || !selected) return;
    const id = selected;
    const kind = button.dataset['photoReact'] as ReactionKind;
    const key = reactionKey(id, kind);
    pending.add(key);
    paint();
    const result = await controller.react(id, kind);
    pending.delete(key);
    if (!alive) return;
    if (result.status === 'added') {
      counts[key] = Math.max(counts[key] ?? 0, result.count);
    }
    if (id === selected) {
      const messages = {
        added: 'Reaction added. It stays with this photo.',
        duplicate: 'You’ve already added this reaction.',
        unavailable: 'Photo reactions are unavailable right now.',
        storage: 'Your browser couldn’t retain the reaction identity. Please try again.',
        failed: 'Your reaction couldn’t be saved. Please try again.',
      };
      status.textContent = messages[result.status];
    }
    paint();
  };
  const storage = () => paint();
  const resume = (event: PageTransitionEvent) => {
    if (event.persisted && loaded) refresh();
  };
  root.addEventListener('click', click);
  dialog.ownerDocument.addEventListener('daysforth:storage', storage);
  win.addEventListener('pageshow', resume);
  return {
    select(id: string) {
      selected = id;
      status.textContent = endpoint ? '' : 'Photo reactions are temporarily unavailable.';
      paint();
      if (!loaded && id) {
        loaded = true;
        refresh();
      }
    },
    destroy() {
      alive = false;
      root.removeEventListener('click', click);
      dialog.ownerDocument.removeEventListener('daysforth:storage', storage);
      win.removeEventListener('pageshow', resume);
    },
  };
}
