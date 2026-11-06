/**
 * Purpose: Load optional controls when requested or first useful without losing native commands.
 * Scope: Shared preloading, primary-click intent, direct activation, settings requests, gestures, and cleanup.
 * Does NOT belong: Dialog content, storage decisions, or native link navigation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clickedControl } from './click-intent';
import {
  reportBrowserFailure,
  runBrowserCommand,
  type BrowserComponent,
} from './browser-diagnostics';

export function deferControl(
  doc: Document,
  selector: string,
  load: () => Promise<() => void>,
  {
    request = '',
    edge = false,
    activate = (control: HTMLElement) => control.click(),
    component = 'optional',
    fallback = () => {},
  }: {
    request?: string;
    edge?: boolean;
    activate?: (control: HTMLElement) => void | Promise<void>;
    component?: BrowserComponent;
    fallback?: () => void;
  } = {},
) {
  let pending: Promise<void> | undefined;
  let stop: (() => void) | undefined;
  let disposed = false;
  let touching = false;
  let nativeFallback = false;
  const replay: { run: () => void | Promise<void>; link?: HTMLAnchorElement }[] = [];
  const detach = () => {
    doc.removeEventListener('click', intent, true);
    if (request) doc.removeEventListener(request, intent);
    if (edge) {
      doc.removeEventListener('touchstart', intent);
      doc.removeEventListener('touchend', intent);
    }
  };
  const deliver = (action: () => void | Promise<void>) => runBrowserCommand(doc, component, action);
  const initialize = async () => {
    const cleanup = await load();
    if (disposed) {
      cleanup();
      return;
    }
    stop = cleanup;
    detach();
    for (const action of replay.splice(0)) deliver(action.run);
  };
  const preload = () => {
    if (disposed) return Promise.resolve();
    pending ??= initialize().catch(() => {
      pending = undefined;
      if (disposed) return;
      reportBrowserFailure(doc, component, 'load');
      deliver(fallback);
      nativeFallback = true;
      for (const { link } of replay.splice(0)) if (link) deliver(() => link.click());
      nativeFallback = false;
    });
    return pending;
  };
  const intent = (event: Event) => {
    if (nativeFallback) return;
    const target = event.target;
    if (event instanceof MouseEvent) {
      const control = clickedControl(event, selector);
      if (!control) return;
      event.preventDefault();
      replay.push({
        run: () => activate(control),
        ...(control instanceof HTMLAnchorElement ? { link: control } : {}),
      });
    } else if (event.type === request)
      replay.push({
        run: () => {
          doc.dispatchEvent(new CustomEvent(request));
        },
      });
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
      replay.push({
        run: () => {
          target!.dispatchEvent(event);
        },
      });
    } else return;
    void preload();
  };
  doc.addEventListener('click', intent, true);
  if (request) doc.addEventListener(request, intent);
  if (edge) {
    doc.addEventListener('touchstart', intent, { passive: true });
    doc.addEventListener('touchend', intent, { passive: true });
  }
  const cleanup = () => {
    disposed = true;
    replay.length = 0;
    detach();
    stop?.();
  };
  return Object.assign(cleanup, { preload });
}
