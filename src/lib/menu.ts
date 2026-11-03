/**
 * Purpose: The accessible disclosure menu used for navigation on small screens.
 * Scope: Opens and closes the panel named by the toggle's aria-controls, keeps aria-expanded in
 *   sync, and closes on Escape (returning focus), outside clicks, focus leaving, link choice, or
 *   growing to the desktop layout.
 * Constraints: Without JavaScript the navigation stays visible; CSS hides the panel only when
 *   <html> has the js class.
 * Does NOT belong: Menu markup and styles (src/components/Header.astro).
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

  const setOpen = (value: boolean) => {
    expanded = value;
    button.setAttribute('aria-expanded', String(value));
    panel.setAttribute('data-open', String(value));
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
      button.removeEventListener('click', onButtonClick);
      panel.removeEventListener('click', onPanelClick);
      doc.removeEventListener('keydown', onKeydown);
      doc.removeEventListener('click', onDocumentClick);
      doc.removeEventListener('focusin', onFocusIn);
      desktop?.removeEventListener('change', onViewportChange);
    },
  };

  function onButtonClick() {
    controller.toggle();
  }

  function onPanelClick(event: Event) {
    if (event.target instanceof Element && event.target.closest('a')) {
      controller.close();
    }
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
  }

  function onFocusIn(event: FocusEvent) {
    if (expanded && !contains(event.target)) {
      controller.close();
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
  setOpen(false);

  return controller;
}
