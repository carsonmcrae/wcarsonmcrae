/**
 * Purpose: Scrub between actual event permalinks without returning to the feed.
 * Scope: Proportional month positions, nearest-event previews, and keyboard traversal of same-month events.
 * Does NOT belong: Content, feed scrolling, or network calls.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
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
