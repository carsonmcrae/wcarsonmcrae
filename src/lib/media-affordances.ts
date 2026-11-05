/**
 * Purpose: Let a deliberate touch reveal a card's photo/post affordances before activating them.
 * Scope: One revealed card, first-photo-tap interception, direct link preservation, and cleanup.
 * Does NOT belong: Photo viewer loading, post destinations, or hover/focus styling.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
type MediaWindow = Pick<Window, 'addEventListener' | 'removeEventListener'>;
export function initMediaAffordances(doc: Document, win: MediaWindow): () => void {
  if (!doc.querySelector('.post-media')) return () => {};
  let touch = false;
  const clear = () => {
    for (const card of doc.querySelectorAll<HTMLElement>('[data-media-revealed]'))
      delete card.dataset['mediaRevealed'];
  };
  const cardFor = (target: Element) =>
    target.closest<HTMLElement>('.post-card,.project') ??
    target.closest<HTMLElement>('.post-media');
  const pointer = (event: PointerEvent) => {
    touch = event.pointerType === 'touch' || event.pointerType === 'pen';
    if (!touch) return clear();
    if (!(event.target instanceof Element) || !event.target.closest('.post-media__open')) return;
    const card = cardFor(event.target);
    if (card) {
      // Keep a focus-revealed control targetable when Safari moves focus during the tap.
      clear();
      card.dataset['mediaRevealed'] = 'true';
    }
  };
  const click = (event: MouseEvent) => {
    if (!touch || event.detail === 0 || !(event.target instanceof Element)) return;
    const target = event.target;
    const card = cardFor(target);
    const revealed = card?.dataset['mediaRevealed'] === 'true';
    clear();
    if (!card) return;
    card.dataset['mediaRevealed'] = 'true';
    if (!revealed && target.closest('.post-media [data-photo]')) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === 'Escape') clear();
  };
  win.addEventListener('pointerdown', pointer, true);
  win.addEventListener('click', click, true);
  doc.addEventListener('keydown', key);
  return () => {
    win.removeEventListener('pointerdown', pointer, true);
    win.removeEventListener('click', click, true);
    doc.removeEventListener('keydown', key);
    clear();
  };
}
