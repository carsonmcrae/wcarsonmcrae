/**
 * Purpose: Open any approved photograph in a larger, accessible native dialog.
 * Scope: Delegated triggers, Escape/backdrop close, related moments, scroll isolation, and restored focus.
 * Does NOT belong: Image URL generation or persistence.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function initPhotoViewer(doc: Document) {
  const dialog = doc.querySelector<HTMLDialogElement>('[data-photo-viewer]')!;
  const image = dialog.querySelector<HTMLImageElement>('[data-photo-large]')!;
  const related = dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!;
  let trigger: HTMLElement | null = null;
  const close = () => {
    dialog.close();
    image.removeAttribute('src');
    trigger?.focus({ preventScroll: true });
  };
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const photo = event.target.closest<HTMLAnchorElement>('[data-photo]');
    if (photo) {
      event.preventDefault();
      trigger = photo;
      image.src = photo.href;
      image.alt = photo.querySelector('img')!.alt;
      dialog.querySelector('[data-photo-caption-output]')!.textContent =
        photo.dataset['photoCaption'] ?? image.alt;
      const moment =
        photo.dataset['photoPost'] ??
        photo
          .parentElement!.querySelector<HTMLAnchorElement>('.post-media__open')
          ?.getAttribute('href');
      related.hidden = !moment;
      if (moment) related.href = moment;
      const win = doc.defaultView!;
      win.scrollTo({ top: win.scrollY, left: win.scrollX, behavior: 'instant' });
      dialog.showModal();
    }
    if (event.target.closest('[data-photo-close]') || event.target === dialog) close();
  };
  const cancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  doc.addEventListener('click', click);
  dialog.addEventListener('cancel', cancel);
  return () => {
    doc.removeEventListener('click', click);
    dialog.removeEventListener('cancel', cancel);
  };
}
