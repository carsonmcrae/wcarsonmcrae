/**
 * Purpose: Keep neighboring album photographs visible and directly selectable.
 * Scope: Native thumbnail buttons, current-photo state, roving keyboard focus, and strip-only scrolling.
 * Does NOT belong: Viewer lifecycle, large-image loading, captions, or reactions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { photoDetails } from './photo-albums';

export function initPhotoFilmstrip(strip: HTMLElement, select: (index: number) => void) {
  let buttons: HTMLButtonElement[] = [];
  let current = 0;
  const paint = (index: number) => {
    current = index;
    for (const [position, button] of buttons.entries()) {
      button.tabIndex = position === index ? 0 : -1;
      if (position === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    const active = buttons[index];
    if (!active) return;
    const left = active.offsetLeft + active.offsetWidth / 2 - strip.clientWidth / 2;
    strip.scrollTo({
      left: Math.max(0, Math.min(left, strip.scrollWidth - strip.clientWidth)),
      behavior: 'instant',
    });
  };
  const choose = (index: number) => {
    select(index);
    buttons[index]!.focus({ preventScroll: true });
  };
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button) return;
    const index = buttons.indexOf(button);
    if (index >= 0) choose(index);
  };
  const key = (event: KeyboardEvent) => {
    if (buttons.length === 0) return;
    const destinations: Record<string, number> = {
      ArrowLeft: (current - 1 + buttons.length) % buttons.length,
      ArrowRight: (current + 1) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    };
    const index = destinations[event.key];
    if (index === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    choose(index);
  };
  strip.addEventListener('click', click);
  strip.addEventListener('keydown', key);
  return {
    set(photos: HTMLAnchorElement[], index: number) {
      const fragment = strip.ownerDocument.createDocumentFragment();
      buttons = photos.map((photo, position) => {
        const details = photoDetails(photo);
        const button = strip.ownerDocument.createElement('button');
        button.type = 'button';
        button.setAttribute(
          'aria-label',
          `Photo ${position + 1} of ${photos.length}: ${details.alt}`,
        );
        const image = strip.ownerDocument.createElement('img');
        image.src = details.thumbnail;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        button.append(image);
        fragment.append(button);
        return button;
      });
      strip.replaceChildren(fragment);
      strip.hidden = photos.length < 2;
      paint(index);
    },
    paint,
    destroy() {
      strip.removeEventListener('click', click);
      strip.removeEventListener('keydown', key);
      strip.replaceChildren();
      buttons = [];
    },
  };
}
