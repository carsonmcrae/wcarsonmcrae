/**
 * Purpose: Scrub between actual event permalinks without returning to the feed.
 * Scope: Proportional month positions, event previews, keyboard traversal, and native return to the feed.
 * Does NOT belong: Content, entry snapshots (page-position.ts), feed rendering, or network calls.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clickedControl } from './click-intent';
import type { PositionWindow } from './page-position';

export function initPostReturn(doc: Document, win: PositionWindow) {
  const click = (event: MouseEvent) => {
    const link = clickedControl(event, '[data-return-timeline]') as HTMLAnchorElement | null;
    if (!link || win.history.length < 2) return;
    const index = win.navigation?.currentEntry?.index ?? 0;
    const previousUrl =
      win.navigation?.entries().find((entry) => entry.index === index - 1)?.url ?? doc.referrer;
    if (!previousUrl) return;
    const previous = new URL(previousUrl);
    const destination = new URL(link.href);
    if (previous.origin === win.location.origin && previous.pathname === destination.pathname) {
      event.preventDefault();
      win.history.back();
    }
  };
  doc.addEventListener('click', click, true);
  return () => doc.removeEventListener('click', click, true);
}

export function initPostNavigation(doc: Document, navigate: (href: string) => void) {
  const root = doc.querySelector<HTMLElement>('[data-post-browser]');
  if (!root) return null;
  const slider = root.querySelector<HTMLInputElement>('input')!;
  const output = root.querySelector<HTMLOutputElement>('output')!;
  const options = Array.from(root.querySelectorAll<HTMLOptionElement>('option'));
  const current = root.dataset['postBrowser'];
  const nearest = () =>
    options.toSorted(
      (a, b) =>
        Math.abs(Number(a.value) - Number(slider.value)) -
          Math.abs(Number(b.value) - Number(slider.value)) ||
        Number(b.dataset['id'] === current) - Number(a.dataset['id'] === current),
    )[0]!;
  const preview = () => {
    const label = nearest().getAttribute('label')!;
    output.textContent = label;
    slider.setAttribute('aria-valuetext', label);
  };
  const change = () => {
    const option = nearest();
    slider.value = option.value;
    if (option.dataset['id'] === current) preview();
    else navigate(option.dataset['href']!);
  };
  const onKey = (event: KeyboardEvent) => {
    let step = 0;
    if (event.key === 'ArrowLeft') step = -1;
    if (event.key === 'ArrowRight') step = 1;
    if (step === 0) return;
    event.preventDefault();
    const next = options[options.findIndex((option) => option.dataset['id'] === current) + step];
    if (next) navigate(next.dataset['href']!);
  };
  slider.addEventListener('input', preview);
  slider.addEventListener('change', change);
  slider.addEventListener('keydown', onKey);
  slider.disabled = false;
  return () => {
    slider.removeEventListener('input', preview);
    slider.removeEventListener('change', change);
    slider.removeEventListener('keydown', onKey);
  };
}
