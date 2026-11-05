/**
 * Purpose: Accessible mobile navigation with a native modal drawer and disclosure fallback.
 * Scope: Expanded state, modal focus, Escape, backdrop/close/link dismissal, viewport changes,
 *   and reserved-edge-aware touch gestures. The nonmodal fallback also closes when focus leaves.
 * Constraints: Without JavaScript the navigation stays visible; CSS hides the panel only when
 *   <html> has the js class.
 * Does NOT belong: Menu markup and styles (src/components/Header.astro).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
const DESKTOP_QUERY = '(min-width: 40rem)';

export interface MenuController {
  open(): void;
  close(options?: { returnFocus?: boolean }): void;
  toggle(): void;
  isOpen(): boolean;
  destroy(): void;
}

type MenuWindow = Pick<Window, 'matchMedia'>;

export function initMenu(doc: Document, win: MenuWindow): MenuController | null {
  const button = doc.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panelId = button?.getAttribute('aria-controls');
  const panel = panelId ? doc.getElementById(panelId) : null;
  if (!button || !panel) {
    return null;
  }

  const desktop = typeof win.matchMedia === 'function' ? win.matchMedia(DESKTOP_QUERY) : null;
  let expanded = false;
  const modal = panel instanceof HTMLDialogElement ? panel : null;
  let touch: { x: number; y: number; open: boolean } | null = null;

  const setOpen = (value: boolean) => {
    expanded = value;
    button.setAttribute('aria-expanded', String(value));
    panel.dataset['open'] = String(value);
    doc.documentElement.dataset['menuOpen'] = String(value);
    if (modal) {
      if (value && !modal.open) modal.showModal();
      if (!value && modal.open) modal.close();
    }
  };

  const contains = (target: EventTarget | null) =>
    target instanceof Node && (panel.contains(target) || button.contains(target));

  const controller: MenuController = {
    open: () => setOpen(true),
    close: ({ returnFocus = false } = {}) => {
      if (!expanded) {
        return;
      }
      setOpen(false);
      if (returnFocus) {
        button.focus();
      }
    },
    toggle: () => (expanded ? controller.close() : controller.open()),
    isOpen: () => expanded,
    destroy: () => {
      setOpen(false);
      button.removeEventListener('click', onButtonClick);
      panel.removeEventListener('click', onPanelClick);
      doc.removeEventListener('keydown', onKeydown);
      doc.removeEventListener('click', onDocumentClick);
      doc.removeEventListener('focusin', onFocusIn);
      desktop?.removeEventListener('change', onViewportChange);
      panel.removeEventListener('cancel', onCancel);
      doc.removeEventListener('touchstart', onTouchStart);
      doc.removeEventListener('touchend', onTouchEnd);
    },
  };

  function onButtonClick() {
    controller.toggle();
  }

  function onPanelClick(event: Event) {
    if (event.target instanceof Element && event.target.closest('a')) {
      controller.close();
    }
    if (event.target instanceof Element && event.target.closest('[data-menu-close]'))
      controller.close({ returnFocus: true });
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && expanded) {
      controller.close({ returnFocus: true });
    }
  }

  function onDocumentClick(event: Event) {
    if (expanded && !contains(event.target)) {
      controller.close();
    }
    if (
      modal &&
      event.target === modal &&
      (event as MouseEvent).clientX > modal.getBoundingClientRect().right
    )
      controller.close({ returnFocus: true });
  }

  function onFocusIn(event: FocusEvent) {
    if (expanded && !modal && !contains(event.target)) {
      controller.close();
    }
  }
  function onCancel(event: Event) {
    event.preventDefault();
    controller.close({ returnFocus: true });
  }
  function onTouchStart(event: TouchEvent) {
    const point = event.touches[0];
    if (!point || desktop?.matches) return;
    if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea'))
      return;
    if (expanded || (point.clientX > 16 && point.clientX <= 48))
      touch = { x: point.clientX, y: point.clientY, open: expanded };
  }
  function onTouchEnd(event: TouchEvent) {
    const start = touch;
    touch = null;
    const point = event.changedTouches[0];
    if (!start || !point) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (start.open && dx < 0) controller.close({ returnFocus: true });
      if (!start.open && dx > 0) controller.open();
    }
  }

  function onViewportChange(event: MediaQueryListEvent) {
    if (event.matches) {
      controller.close();
    }
  }

  button.addEventListener('click', onButtonClick);
  panel.addEventListener('click', onPanelClick);
  doc.addEventListener('keydown', onKeydown);
  doc.addEventListener('click', onDocumentClick);
  doc.addEventListener('focusin', onFocusIn);
  desktop?.addEventListener('change', onViewportChange);
  panel.addEventListener('cancel', onCancel);
  doc.addEventListener('touchstart', onTouchStart, { passive: true });
  doc.addEventListener('touchend', onTouchEnd, { passive: true });
  setOpen(false);

  return controller;
}
