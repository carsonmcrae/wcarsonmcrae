/**
 * Purpose: Verify the browser entry points compose real enhancements and dispose their listeners.
 * Scope: Initial hydration, deferred photo/privacy/menu/action intent, feed restoration markers, and cleanup.
 * Does NOT belong: Mocked initializer call counts or browser layout assertions.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CONSENT_KEY } from '../../src/lib/consent';
import { fakeMediaQuery, memoryStorage } from './helpers';

const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.resetModules();
  document.documentElement.className = 'js';
  document.documentElement.dataset['timelineRestore'] = '';
  delete document.documentElement.dataset['siteReady'];
  delete document.documentElement.dataset['theme'];
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => fakeMediaQuery(false)),
  );
  vi.stubEnv('PUBLIC_REACTIONS_URL', 'https://api.example.com');
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({ born: 3 })));
  document.body.innerHTML = `
    <button data-theme-toggle aria-pressed="false">Dark mode</button>
    <button data-history="back"></button><button data-history="forward"></button>
    <a href="/photo.webp" data-photo data-photo-post="/posts/born/"><img alt="A portrait"></a>
    <dialog data-photo-viewer><button data-photo-close>Close photo</button><img data-photo-large>
      <figcaption data-photo-caption-output></figcaption><a data-photo-related hidden></a></dialog>
    <button data-menu-toggle aria-controls="test-menu" aria-expanded="false">Menu</button>
    <dialog id="test-menu"><button data-menu-close>Close menu</button></dialog>
    <button data-storage-open>Storage settings</button><aside data-storage-notice hidden></aside>
    <dialog data-storage-dialog><p data-storage-status></p><p data-storage-feedback></p>
      <button data-storage-choice="no">Storage off</button><button data-storage-close>Close settings</button></dialog>
    <div data-image-frame><img data-fallback src="/unavailable.webp"></div>
    <details data-timeline-menu><summary>Categories</summary><p>Choices</p></details>`;
});
afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  document.body.innerHTML = '';
  delete document.documentElement.dataset['menuOpen'];
  delete document.documentElement.dataset['timelineRestore'];
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function button(selector: string) {
  return document.querySelector<HTMLButtonElement>(selector)!;
}

it('hydrates a page, loads each real enhancement on intent, and detaches them on disposal', async () => {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ allowed: true, expires: Number.MAX_SAFE_INTEGER }),
  );
  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div data-post-actions="born" data-post-title="Born" data-post-url="/posts/born/">
      <button data-save aria-pressed="false"><span data-save-label>Save</span></button>
      <button data-react="heart" aria-pressed="false"><span data-reaction-count>—</span></button>
    </div>
    <aside data-action-notice hidden><span data-notice-text></span><button data-dismiss-notice>Dismiss</button></aside>
    <span data-action-live></span>`,
  );
  const { stopSite } = await import('../../src/scripts/site');
  cleanups.push(stopSite);
  expect(document.documentElement.dataset['siteReady']).toBe('true');
  expect(document.documentElement.dataset['timelineRestore']).toBeUndefined();
  expect(document.querySelector<HTMLElement>('[data-storage-notice]')!.hidden).toBe(true);
  await vi.waitFor(() =>
    expect(document.querySelector('[data-reaction-count]')!.textContent).toBe('3'),
  );
  expect(fetch).toHaveBeenCalledWith('https://api.example.com/reactions', { cache: 'no-store' });
  button('[data-theme-toggle]').click();
  expect(document.documentElement.dataset['theme']).toBe('dark');
  document.querySelector('img[data-fallback]')!.dispatchEvent(new Event('error'));
  expect(document.querySelector<HTMLElement>('[data-image-frame]')!.dataset['imageFailed']).toBe(
    '',
  );

  const photo = document.querySelector<HTMLAnchorElement>('[data-photo]')!;
  photo.click();
  const viewer = document.querySelector<HTMLDialogElement>('[data-photo-viewer]')!;
  await vi.waitFor(() => expect(viewer.open).toBe(true));
  expect(viewer.querySelector<HTMLImageElement>('[data-photo-large]')!.src).toBe(photo.href);
  button('[data-photo-close]').click();
  expect(viewer.open).toBe(false);

  button('[data-menu-toggle]').click();
  await vi.waitFor(() =>
    expect(button('[data-menu-toggle]').getAttribute('aria-expanded')).toBe('true'),
  );
  button('[data-menu-close]').click();
  expect(button('[data-menu-toggle]').getAttribute('aria-expanded')).toBe('false');

  button('[data-save]').click();
  await vi.waitFor(() => expect(button('[data-save]').getAttribute('aria-pressed')).toBe('true'));
  expect(document.querySelector('[data-notice-text]')!.textContent).toBe('Saved in this browser.');
  expect(localStorage.getItem('daysforth.saved.born')).toBe('true');
  button('[data-storage-open]').click();
  const privacy = document.querySelector<HTMLDialogElement>('[data-storage-dialog]')!;
  await vi.waitFor(() => expect(privacy.open).toBe(true));
  button('[data-storage-choice]').click();
  expect(privacy.open).toBe(false);
  expect(localStorage.getItem('daysforth.saved.born')).toBeNull();
  expect(button('[data-save]').getAttribute('aria-pressed')).toBe('false');

  stopSite();
  button('[data-theme-toggle]').click();
  expect(document.documentElement.dataset['theme']).toBe('dark');
  button('[data-save]').click();
  expect(button('[data-save]').getAttribute('aria-pressed')).toBe('false');
  button('[data-storage-open]').click();
  expect(privacy.open).toBe(false);
  button('[data-menu-toggle]').click();
  expect(button('[data-menu-toggle]').getAttribute('aria-expanded')).toBe('false');
  photo.click();
  expect(viewer.open).toBe(false);
});

it('keeps timeline restoration ownership and undecided storage visible before any deferred load', async () => {
  document.body.insertAdjacentHTML('beforeend', '<section data-timeline></section>');
  const { stopSite } = await import('../../src/scripts/site');
  cleanups.push(stopSite);
  expect(document.documentElement.dataset['timelineRestore']).toBe('');
  expect(document.querySelector<HTMLElement>('[data-storage-notice]')!.hidden).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
  const menu = document.querySelector('details')!;
  menu.open = true;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(menu.open).toBe(false);
  stopSite();
  menu.open = true;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(menu.open).toBe(true);
});

it('loads privacy settings from the shared request event before any settings button is used', async () => {
  const { stopSite } = await import('../../src/scripts/site');
  cleanups.push(stopSite);
  const dialog = document.querySelector<HTMLDialogElement>('[data-storage-dialog]')!;
  document.dispatchEvent(new CustomEvent('daysforth:privacy-request'));
  await vi.waitFor(() => expect(dialog.open).toBe(true));
  expect(dialog.querySelector('[data-storage-status]')!.textContent).toBe(
    'Optional storage is off.',
  );
  button('[data-storage-close]').click();
  stopSite();
  document.dispatchEvent(new CustomEvent('daysforth:privacy-request'));
  expect(dialog.open).toBe(false);
});
