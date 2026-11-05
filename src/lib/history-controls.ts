/**
 * Purpose: Mirror the browser’s available back/forward destinations in the app header.
 * Scope: Native Navigation API signals and a conservative older-browser fallback.
 * Does NOT belong: Custom browsing-history storage or routing implementation.
 */
interface NavigationState extends EventTarget {
  canGoBack: boolean;
  canGoForward: boolean;
}
type HistoryWindow = Pick<Window, 'history' | 'addEventListener' | 'removeEventListener'> & {
  navigation?: NavigationState;
};
let maximumIndex = 0;
export function initHistoryControls(doc: Document, win: HistoryWindow) {
  const back = doc.querySelector<HTMLButtonElement>('[data-history="back"]')!;
  const forward = doc.querySelector<HTMLButtonElement>('[data-history="forward"]')!;
  const sync = () => {
    const index = Number(win.history.state?.index ?? 0);
    maximumIndex = Math.max(maximumIndex, index);
    const knownIndex = typeof win.history.state?.index === 'number';
    const unavailable = win.history.length <= 1;
    let backUnavailable = unavailable;
    let forwardUnavailable = unavailable;
    if (knownIndex) {
      backUnavailable = index === 0;
      forwardUnavailable = index >= maximumIndex;
    }
    if (win.navigation) {
      backUnavailable = !win.navigation.canGoBack;
      forwardUnavailable = !win.navigation.canGoForward;
    }
    back.disabled = backUnavailable;
    forward.disabled = forwardUnavailable;
  };
  const goBack = () => win.history.back();
  const goForward = () => win.history.forward();
  back.addEventListener('click', goBack);
  forward.addEventListener('click', goForward);
  win.navigation?.addEventListener('currententrychange', sync);
  win.addEventListener('popstate', sync);
  win.addEventListener('pageshow', sync);
  doc.addEventListener('daysforth:history', sync);
  sync();
  return () => {
    back.removeEventListener('click', goBack);
    forward.removeEventListener('click', goForward);
    win.navigation?.removeEventListener('currententrychange', sync);
    win.removeEventListener('popstate', sync);
    win.removeEventListener('pageshow', sync);
    doc.removeEventListener('daysforth:history', sync);
  };
}
