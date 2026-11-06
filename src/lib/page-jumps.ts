/**
 * Purpose: Offer useful page-edge shortcuts after deliberate scrolling on secondary pages.
 * Scope: Travel qualification, document edges, modal-safe activation, focus destinations, and cleanup.
 * Does NOT belong: Timeline/dock geometry, history state, persistence, or network requests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { isScrollLocked, observeUserScroll, type ScrollChange } from './scroll-intent';
type PageWindow = Pick<
  Window,
  'scrollY' | 'innerHeight' | 'scrollTo' | 'addEventListener' | 'removeEventListener'
>;

export function initPageJumps(doc: Document, win: PageWindow): () => void {
  const up = doc.querySelector<HTMLButtonElement>('[data-page-edge="top"]');
  const down = doc.querySelector<HTMLButtonElement>('[data-page-edge="bottom"]');
  const main = doc.querySelector('main');
  const footer = doc.querySelector('footer');
  if (!up || !down || !main || !footer) return () => {};
  const footerTab = footer.getAttribute('tabindex');
  footer.tabIndex = -1;
  const extent = () => Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
  let travel = 0;
  let qualified = false;
  const update = ({ user, delta }: ScrollChange) => {
    const bottom = extent();
    if (user) {
      travel += Math.abs(delta);
      const threshold = Math.max(44, Math.min(160, win.innerHeight / 4, bottom));
      if (travel >= threshold) qualified = true;
    }
    const unavailable = !qualified || bottom < 44 || isScrollLocked(doc);
    up.hidden = unavailable || win.scrollY <= 1;
    down.hidden = unavailable || win.scrollY >= bottom - 1;
  };
  const jump = (button: HTMLButtonElement, target: HTMLElement, top: number) => {
    if (button.hidden || isScrollLocked(doc)) return;
    win.scrollTo({ top, behavior: 'instant' });
    target.focus({ preventScroll: true });
  };
  const top = () => jump(up, main, 0);
  const bottom = () => jump(down, footer, extent());
  up.addEventListener('click', top);
  down.addEventListener('click', bottom);
  const intent = observeUserScroll(doc, win, update);
  intent.refresh();
  return () => {
    intent.destroy();
    up.removeEventListener('click', top);
    down.removeEventListener('click', bottom);
    up.hidden = true;
    down.hidden = true;
    if (footerTab === null) footer.removeAttribute('tabindex');
    else footer.setAttribute('tabindex', footerTab);
  };
}
