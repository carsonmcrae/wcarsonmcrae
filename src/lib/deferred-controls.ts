/**
 * Purpose: Load optional dialog and drawer behavior only when a visitor intends to use it.
 * Scope: Primary-click replay, explicit settings requests, buffered edge gestures, and cleanup.
 * Does NOT belong: Dialog content, storage decisions, or native link navigation.
 */
export function deferControl(
  doc: Document,
  selector: string,
  load: () => Promise<() => void>,
  { request = '', edge = false }: { request?: string; edge?: boolean } = {},
) {
  let pending: Promise<void> | undefined;
  let stop: (() => void) | undefined;
  let disposed = false;
  let touching = false;
  const replay: (() => void)[] = [];
  const detach = () => {
    doc.removeEventListener('click', intent, true);
    if (request) doc.removeEventListener(request, intent);
    if (edge) {
      doc.removeEventListener('touchstart', intent);
      doc.removeEventListener('touchend', intent);
    }
  };
  const intent = (event: Event) => {
    const target = event.target;
    if (event instanceof MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(target instanceof Element) ||
        !target.closest(selector)
      )
        return;
      event.preventDefault();
      replay.push(() => {
        (target.closest(selector) as HTMLElement).click();
      });
    } else if (event.type === request)
      replay.push(() => doc.dispatchEvent(new CustomEvent(request)));
    else if (edge && event instanceof TouchEvent) {
      if (event.type === 'touchstart') {
        const point = event.touches[0];
        if (
          !point ||
          point.clientX <= 16 ||
          point.clientX > 48 ||
          (target instanceof Element && target.closest('a,button,input,select,textarea'))
        )
          return;
        touching = true;
      } else if (!touching) return;
      replay.push(() => target!.dispatchEvent(event));
    } else return;
    pending ??= load()
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }
        stop = cleanup;
        detach();
        for (const action of replay) action();
      })
      .catch(() => {
        detach();
        doc.documentElement.classList.remove('js');
      });
  };
  doc.addEventListener('click', intent, true);
  if (request) doc.addEventListener(request, intent);
  if (edge) {
    doc.addEventListener('touchstart', intent, { passive: true });
    doc.addEventListener('touchend', intent, { passive: true });
  }
  return () => {
    disposed = true;
    detach();
    stop?.();
  };
}
