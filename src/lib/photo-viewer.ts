/**
 * Purpose: Enlarge approved photos and browse complete albums in a native modal.
 * Scope: Previous/next, keyboard and touch navigation, captions, related moments, and restored focus.
 * Does NOT belong: Album facts, image URL generation, or browser persistence.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { albumPhotos, photoDetails } from './photo-albums';
import { initPhotoFilmstrip } from './photo-filmstrip';
import { initPhotoReactionControls } from './photo-reaction-controls';
import { clickedControl } from './click-intent';
export function initPhotoViewer(doc: Document, endpoint = '') {
  const dialog = doc.querySelector<HTMLDialogElement>('[data-photo-viewer]')!;
  const image = dialog.querySelector<HTMLImageElement>('[data-photo-large]')!;
  const related = dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!;
  const previous = dialog.querySelector<HTMLButtonElement>('[data-photo-previous]');
  const next = dialog.querySelector<HTMLButtonElement>('[data-photo-next]');
  const count = dialog.querySelector<HTMLElement>('[data-photo-count]');
  const stage = dialog.querySelector<HTMLElement>('[data-photo-stage]') ?? dialog;
  const strip = dialog.querySelector<HTMLElement>('[data-photo-strip]');
  const filmstrip = strip
    ? initPhotoFilmstrip(strip, (next) => {
        index = next;
        show();
      })
    : null;
  const reactionControls = dialog.querySelector('[data-photo-reactions]')
    ? initPhotoReactionControls(dialog, doc.defaultView!, endpoint)
    : null;
  let trigger: HTMLAnchorElement | null = null;
  let photos: HTMLAnchorElement[] = [];
  let index = 0;
  let touch: Touch | undefined;
  const show = (resetFilmstrip = false) => {
    const photo = photoDetails(photos[index]!);
    image.src = photo.src;
    image.alt = photo.alt;
    dialog.querySelector('[data-photo-caption-output]')!.textContent = photo.caption;
    related.hidden = !photo.moment;
    if (photo.moment) related.href = photo.moment;
    const single = photos.length === 1;
    if (previous) previous.hidden = single;
    if (next) next.hidden = single;
    if (count) {
      count.hidden = single;
      count.textContent = `Photo ${index + 1} of ${photos.length}`;
    }
    if (resetFilmstrip) filmstrip?.set(photos, index);
    else filmstrip?.paint(index);
    reactionControls?.select(photo.reactionId);
    const announcement = dialog.querySelector('[data-photo-announcement]');
    if (announcement)
      announcement.textContent = `Photo ${index + 1} of ${photos.length}. ${photo.caption}`;
  };
  const move = (step: number) => {
    if (!dialog.open) return;
    index = (index + step + photos.length) % photos.length;
    show();
  };
  const close = () => {
    dialog.close();
    image.removeAttribute('src');
    trigger?.focus({ preventScroll: true });
  };
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const photo = clickedControl(event, '[data-photo]') as HTMLAnchorElement | null;
    if (photo) {
      event.preventDefault();
      trigger = photo;
      photos = albumPhotos(doc, photo);
      index = photos.findIndex((item) => item.href === photo.href);
      const win = doc.defaultView!;
      win.scrollTo({ top: win.scrollY, left: win.scrollX, behavior: 'instant' });
      dialog.showModal();
      show(true);
    }
    if (event.target.closest('[data-photo-previous]')) move(-1);
    if (event.target.closest('[data-photo-next]')) move(1);
    if (event.target.closest('[data-photo-close]') || event.target === dialog) close();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  };
  const touchstart = (event: TouchEvent) => {
    touch = event.touches.length === 1 ? event.touches[0] : undefined;
  };
  const touchend = (event: TouchEvent) => {
    const start = touch;
    touch = undefined;
    const end = event.changedTouches[0];
    if (!start || !end) return;
    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  };
  const cancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  doc.addEventListener('click', click);
  dialog.addEventListener('cancel', cancel);
  dialog.addEventListener('keydown', keydown);
  stage.addEventListener('touchstart', touchstart, { passive: true });
  stage.addEventListener('touchend', touchend, { passive: true });
  return () => {
    filmstrip?.destroy();
    reactionControls?.destroy();
    doc.removeEventListener('click', click);
    dialog.removeEventListener('cancel', cancel);
    dialog.removeEventListener('keydown', keydown);
    stage.removeEventListener('touchstart', touchstart);
    stage.removeEventListener('touchend', touchend);
  };
}
