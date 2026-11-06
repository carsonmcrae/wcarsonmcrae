/**
 * Purpose: Keep timeline command code off the initial path while preserving the complete default view.
 * Scope: Initial/query/restored states, real intent, captured native command values, and disposal.
 * Does NOT belong: Timeline algorithms, synthetic event replay, or server state.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clickedControl } from './click-intent';
import { prepareTimelineRestore } from './page-position';
import { reportBrowserFailure, runBrowserCommand } from './browser-diagnostics';
import type { TimelineCommandKind } from './timeline-controller';
import { observeUserScroll, type ScrollChange } from './scroll-intent';

interface TimelineMount {
  activate(target: Element, kind: TimelineCommandKind): void;
  destroy(): void;
}
export function initDeferredTimeline(
  doc: Document,
  win: Window,
  load?: () => Promise<TimelineMount>,
) {
  const root = doc.querySelector('[data-timeline]');
  if (!root) return () => {};
  const position = prepareTimelineRestore(win);
  const params = new URLSearchParams(win.location.search);
  const conditional =
    position !== null || ['date', 'view', 'category', 'detail'].some((key) => params.has(key));
  let disposed = false;
  const fallback = () => {
    if (disposed) return;
    reportBrowserFailure(doc, 'timeline', 'load');
    doc.documentElement.dataset['timelineFallback'] = '';
    delete doc.documentElement.dataset['timelineRestore'];
  };
  const commands: (() => void)[] = [];
  let pending: Promise<void> | undefined;
  let controller: TimelineMount | undefined;
  let gesture: ScrollChange = { user: false, delta: 0 };
  const ready = () => {
    doc.documentElement.dataset['timelineReady'] = 'true';
    delete doc.documentElement.dataset['timelineFallback'];
    delete doc.documentElement.dataset['timelineRestore'];
  };
  const detach = () => {
    for (const kind of ['click', 'input', 'change', 'submit', 'focusin'])
      doc.removeEventListener(kind, intent, true);
    gestures.destroy();
  };
  const initialize = async () => {
    let mounted: TimelineMount;
    if (load) mounted = await load();
    else {
      let desktop: MediaQueryList | null = null;
      try {
        if (typeof win.matchMedia === 'function') desktop = win.matchMedia('(min-width: 70rem)');
      } catch {
        reportBrowserFailure(doc, 'timeline', 'initialization');
      }
      const navigation = desktop?.matches
        ? import('./moment-navigator').catch(() => {
            if (!disposed) reportBrowserFailure(doc, 'timeline', 'load');
            return null;
          })
        : undefined;
      const { mountInteractiveTimeline } = await import('./timeline-mount');
      if (disposed) return;
      mounted = mountInteractiveTimeline(doc, win, gesture, desktop, !conditional, navigation);
    }
    if (disposed) {
      mounted.destroy();
      return;
    }
    controller = mounted;
    if (position !== null) win.scrollTo({ top: position, behavior: 'instant' });
    detach();
    ready();
    for (const command of commands.splice(0)) runBrowserCommand(doc, 'timeline', command);
  };
  const start = () => {
    pending ??= initialize().catch(() => {
      commands.length = 0;
      detach();
      fallback();
    });
  };
  const intent = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    let target = event.target;
    if (event instanceof MouseEvent) {
      const control = clickedControl(event, '[data-jump-date],button[data-view]');
      if (!control) return;
      target = control;
    } else if (!target.closest('.timeline-dock')) return;
    if (event.type === 'input' && !target.matches('[data-date-slider]')) return;
    if (event.type === 'focusin') {
      start();
      return;
    }
    event.preventDefault();
    const fields =
      event.type === 'submit'
        ? [...target.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')]
        : [target].filter(
            (field): field is HTMLInputElement | HTMLSelectElement =>
              field instanceof HTMLInputElement || field instanceof HTMLSelectElement,
          );
    const values = fields.map((field) => ({
      field,
      value: field.value,
      checked: field instanceof HTMLInputElement && field.checked,
    }));
    commands.push(() => {
      for (const { field, value, checked } of values) {
        field.value = value;
        if (field instanceof HTMLInputElement) field.checked = checked;
      }
      controller!.activate(target, event.type as TimelineCommandKind);
    });
    start();
  };
  for (const kind of ['click', 'input', 'change', 'submit', 'focusin'])
    doc.addEventListener(kind, intent, true);
  const gestures = observeUserScroll(doc, win, (change) => {
    if (change.user && change.delta !== 0) gesture = change;
    if (win.scrollY > 0) start();
  });
  gestures.refresh();
  if (conditional) start();
  else ready();
  return () => {
    disposed = true;
    commands.length = 0;
    detach();
    controller?.destroy();
  };
}
