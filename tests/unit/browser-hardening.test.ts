/**
 * Purpose: Protect isolated enhancement recovery and truthful privacy failure handling.
 * Scope: Explicit retry, native-link recovery, bounded safe diagnostics, and denied storage removal.
 * Does NOT belong: Browser rendering, deployment verification, or live service requests.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { deferControl } from '../../src/lib/deferred-controls';
import {
  reportBrowserFailure,
  startBrowserFeature,
  type BrowserComponent,
} from '../../src/lib/browser-diagnostics';
import {
  clearPreferences,
  consentChoice,
  preferenceStorage,
  recordConsent,
} from '../../src/lib/consent';
import { initPrivacyControls } from '../../src/lib/privacy-controls';
import { initPhotoViewer } from '../../src/lib/photo-viewer';
import { releaseVersion } from '../../src/lib/release-identity';
import { consentingStorage, disposeDocument, memoryStorage } from './helpers';

const stops: (() => void)[] = [];
afterEach(() => {
  disposeDocument(stops);
  vi.restoreAllMocks();
});

it('retains unrelated enhancements, retries only on a new intent, and delivers once after recovery', async () => {
  document.body.innerHTML = '<button data-open>Open</button>';
  document.documentElement.classList.add('js');
  const load = vi.fn<() => Promise<() => void>>().mockRejectedValueOnce(new Error('private URL'));
  const activate = vi.fn();
  const fallback = vi.fn();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const cleanup = vi.fn();
  load.mockResolvedValueOnce(cleanup);
  stops.push(
    deferControl(document, '[data-open]', load, { activate, fallback, component: 'privacy' }),
  );
  document.querySelector<HTMLButtonElement>('button')!.click();
  await vi.waitFor(() => expect(fallback).toHaveBeenCalledOnce());
  expect(load).toHaveBeenCalledOnce();
  expect(document.documentElement.classList.contains('js')).toBe(true);
  expect(warning).toHaveBeenCalledWith('[Daysforth]', {
    code: 'DF_ENHANCEMENT_LOAD',
    component: 'privacy',
    category: 'load',
    release: releaseVersion,
  });
  document.querySelector<HTMLButtonElement>('button')!.click();
  await vi.waitFor(() => expect(activate).toHaveBeenCalledOnce());
  expect(load).toHaveBeenCalledTimes(2);
});

it('recovers the original native anchor when its module cannot load', async () => {
  document.body.innerHTML = '<a href="/image.webp" data-open>Image</a>';
  const link = document.querySelector('a')!;
  const clicks: boolean[] = [];
  link.addEventListener('click', (event) => clicks.push(event.defaultPrevented));
  const load = vi.fn(() => {
    throw new Error('chunk unavailable');
  });
  const fallback = vi.fn();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  stops.push(deferControl(document, '[data-open]', load, { fallback }));
  link.click();
  await vi.waitFor(() => expect(fallback).toHaveBeenCalledOnce());
  expect(clicks).toEqual([true, false]);
  expect(load).toHaveBeenCalledOnce();
});

it('isolates throwing and rejecting commands after initialization and releases pending intent on disposal', async () => {
  document.body.innerHTML = '<button data-open>Open</button><button data-open>Next</button>';
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const activate = vi
    .fn<() => void | Promise<void>>()
    .mockImplementationOnce(() => {
      throw new Error('private');
    })
    .mockRejectedValueOnce(new Error('private'));
  stops.push(
    deferControl(document, '[data-open]', async () => vi.fn<() => void>(), {
      activate,
      component: 'post-actions',
    }),
  );
  for (const control of document.querySelectorAll<HTMLButtonElement>('button')) control.click();
  await vi.waitFor(() => expect(activate).toHaveBeenCalledTimes(2));
  expect(warn).toHaveBeenCalledTimes(1);
  let reject!: (error: Error) => void;
  const stop = deferControl(
    document,
    '[data-open]',
    () =>
      new Promise((_, no) => {
        reject = no;
      }),
  );
  document.querySelector<HTMLButtonElement>('button')!.click();
  stop();
  reject(new Error('late'));
  await Promise.resolve();
  await Promise.resolve();
  expect(warn).toHaveBeenCalledTimes(1);
});

it('bounds diagnostics per document and remains safe when console output is unavailable', () => {
  const doc = document.implementation.createHTMLDocument();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const component of [
    'photo',
    'privacy',
    'menu',
    'post-actions',
    'optional',
  ] as BrowserComponent[])
    for (const category of ['load', 'activation'] as const)
      reportBrowserFailure(doc, component, category);
  expect(warn).toHaveBeenCalledTimes(8);
  warn.mockImplementation(() => {
    throw new Error('console unavailable');
  });
  expect(() =>
    reportBrowserFailure(document.implementation.createHTMLDocument(), 'photo', 'load'),
  ).not.toThrow();
});

it('isolates programming failures at feature boundaries and cleans each initialized feature once', () => {
  const doc = document.implementation.createHTMLDocument();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const stopFailed = startBrowserFeature(doc, 'theme', () => {
    throw new Error('private');
  });
  const cleanup = vi.fn(() => {
    throw new Error('private');
  });
  const stopWorking = startBrowserFeature(doc, 'history', () => cleanup);
  const stopPlain = startBrowserFeature(doc, 'images', () => {});
  stopFailed();
  stopWorking();
  stopWorking();
  stopPlain();
  expect(cleanup).toHaveBeenCalledOnce();
  expect(warning.mock.calls.map(([, details]) => details.code)).toEqual([
    'DF_ENHANCEMENT_INITIALIZATION',
    'DF_ENHANCEMENT_CLEANUP',
  ]);
});

it('continues removing accessible preferences after individual failures and handles corrupt enumeration', () => {
  const raw = memoryStorage({ theme: 'dark', 'daysforth.saved.born': 'true', unrelated: 'keep' });
  const remove = raw.removeItem.bind(raw);
  vi.spyOn(raw, 'removeItem').mockImplementation((key) => {
    if (key === 'theme') throw new Error('blocked');
    remove(key);
  });
  expect(clearPreferences(raw)).toBe(false);
  expect(raw.getItem('daysforth.saved.born')).toBeNull();
  expect(raw.getItem('unrelated')).toBe('keep');
  vi.spyOn(raw, 'key').mockReturnValue(null);
  expect(clearPreferences(raw)).toBe(true);
  vi.spyOn(raw, 'length', 'get').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(clearPreferences(raw)).toBe(false);
});

function blockedPrivacy() {
  const raw = consentingStorage({ theme: 'dark', 'daysforth.visitor': 'identifier' });
  const preferences = preferenceStorage({ localStorage: raw });
  vi.spyOn(raw, 'removeItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(raw, 'setItem').mockImplementation(() => {
    throw new Error('full');
  });
  document.body.innerHTML =
    '<aside data-storage-notice></aside><dialog data-storage-dialog><p data-storage-status></p><p data-storage-feedback></p></dialog><button data-storage-choice="no">Off</button><button data-forget-browser>Forget</button>';
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ forgotten: true }));
  stops.push(
    initPrivacyControls(document, { localStorage: raw, fetch: fetcher }, 'https://api.example.com'),
  );
  return {
    raw,
    preferences,
    fetcher,
    feedback: document.querySelector('[data-storage-feedback]')!,
  };
}

it("withdraws this page's permission even when persistent removal and recording fail", () => {
  const f = blockedPrivacy();
  document.querySelector<HTMLButtonElement>('[data-storage-choice]')!.click();
  expect(consentChoice(f.raw)).toBe(false);
  expect(f.preferences.getItem('theme')).toBeNull();
  expect(f.feedback.textContent).toContain('could not be removed');
  expect(document.querySelector('[data-storage-status]')!.textContent).toBe(
    'Optional storage is off.',
  );
  vi.restoreAllMocks();
  expect(recordConsent(f.raw, true)).toBe(true);
  expect(consentChoice(f.raw)).toBe(true);
});

it('reports partial local erasure honestly and deduplicates an in-flight Forget action', async () => {
  const f = blockedPrivacy();
  const button = document.querySelector<HTMLButtonElement>('[data-forget-browser]')!;
  button.click();
  expect(f.feedback.textContent).toContain('Some saved browser data could not be removed');
  button.click();
  expect(f.fetcher).toHaveBeenCalledOnce();
  await vi.waitFor(() => expect(f.feedback.textContent).toContain('could not be removed or'));
  expect(f.preferences.getItem('theme')).toBeNull();
});

it('fails unsupported modal enhancement before installing listeners', () => {
  document.body.innerHTML =
    '<dialog data-photo-viewer></dialog><dialog data-storage-dialog></dialog>';
  for (const dialog of document.querySelectorAll('dialog'))
    Object.defineProperty(dialog, 'showModal', { value: undefined });
  expect(() => initPhotoViewer(document)).toThrow('Photo dialog unavailable');
  expect(() => initPrivacyControls(document, window, '')).toThrow('Storage dialog unavailable');
});
