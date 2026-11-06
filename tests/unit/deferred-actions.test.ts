/**
 * Purpose: Preserve immediate remembered choices while loading shared counts only when needed.
 * Scope: Real entry composition, visibility/command loading, failed imports, and pending disposal.
 * Does NOT belong: Real viewport geometry, live service requests, or mocked initializer call counts.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { consentingStorage } from './helpers';

const stops: (() => void)[] = [];
class Visibility {
  static current: Visibility;
  constructor(readonly callback: IntersectionObserverCallback) {
    Visibility.current = this;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  show(visible: boolean) {
    this.callback(
      [{ isIntersecting: visible } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('IntersectionObserver', Visibility);
  vi.stubGlobal('localStorage', consentingStorage());
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({ born: 7 })));
  vi.stubEnv('PUBLIC_REACTIONS_URL', 'https://api.example.com');
  document.body.innerHTML =
    '<div data-post-actions="born"><button data-save><span data-save-label>Save</span></button><button data-react="heart"><span data-reaction-count>—</span></button></div><aside data-action-notice hidden><span data-notice-text></span><button data-dismiss-notice></button></aside><p data-action-live></p>';
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  document.body.innerHTML = '';
  vi.doUnmock('../../src/lib/post-actions');
  vi.doUnmock('../../src/lib/post-enhancements');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function mount() {
  const { startPostActions } = await import('../../src/scripts/actions');
  const stop = startPostActions();
  stops.push(stop);
  return stop;
}

it('hydrates choices immediately and shares one reader across queued visibility callbacks', async () => {
  localStorage.setItem('daysforth.saved.born', 'true');
  const stop = await mount();
  expect(document.querySelector('[data-save]')!.getAttribute('aria-pressed')).toBe('true');
  expect(fetch).not.toHaveBeenCalled();
  Visibility.current.show(false);
  expect(fetch).not.toHaveBeenCalled();
  Visibility.current.show(true);
  Visibility.current.show(true);
  await vi.waitFor(() =>
    expect(document.querySelector('[data-reaction-count]')!.textContent).toBe('7'),
  );
  expect(fetch).toHaveBeenCalledOnce();
  stop();
  Visibility.current.show(true);
  expect(fetch).toHaveBeenCalledOnce();
});

it('delivers the original first Save while its visibility preload is still pending', async () => {
  const ready = Promise.withResolvers<void>();
  vi.doMock('../../src/lib/post-enhancements', async () => {
    await ready.promise;
    return vi.importActual('../../src/lib/post-enhancements');
  });
  await mount();
  const original = document.querySelector<HTMLButtonElement>('[data-save]')!;
  Visibility.current.show(true);
  original.click();
  expect(original.getAttribute('aria-pressed')).toBe('false');
  ready.resolve();
  await vi.waitFor(() => expect(original.getAttribute('aria-pressed')).toBe('true'));
  expect(document.querySelector('[data-save]')).toBe(original);
  expect(localStorage.getItem('daysforth.saved.born')).toBe('true');
  expect(fetch).toHaveBeenCalledOnce();
});

it('does not mount an enhancement whose module arrives after document cleanup', async () => {
  const ready = Promise.withResolvers<void>();
  const initialize = vi.fn();
  vi.doMock('../../src/lib/post-enhancements', async () => {
    await ready.promise;
    return { initPostEnhancements: initialize };
  });
  const stop = await mount();
  Visibility.current.show(true);
  const module = import('../../src/lib/post-enhancements');
  stop();
  ready.resolve();
  await module;
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(initialize).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('keeps a failed reader honest on later intent without replacing the original Save control', async () => {
  vi.doMock('../../src/lib/post-actions', () => {
    throw new Error('private chunk URL');
  });
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await mount();
  const original = document.querySelector<HTMLButtonElement>('[data-save]')!;
  Visibility.current.show(true);
  await vi.waitFor(() => expect(warning).toHaveBeenCalled());
  expect(fetch).not.toHaveBeenCalled();
  original.click();
  await Promise.all([
    import('../../src/lib/post-action-events'),
    import('../../src/lib/notices'),
    import('../../src/lib/post-actions').catch(() => {}),
  ]);
  await Promise.resolve();
  expect(original.getAttribute('aria-pressed')).toBe('false');
  expect(document.querySelector('[data-save]')).toBe(original);
  expect(localStorage.getItem('daysforth.saved.born')).toBeNull();
  expect(warning.mock.calls[0]![1]).toMatchObject({
    code: 'DF_ENHANCEMENT_LOAD',
    component: 'post-actions',
  });
});

it.each([true, false])(
  'does not initialize a late reader or report its failure after disposal (success %s)',
  async (success) => {
    const ready = Promise.withResolvers<void>();
    vi.doMock('../../src/lib/post-actions', async () => {
      await ready.promise;
      if (!success) throw new Error('late private failure');
      return vi.importActual('../../src/lib/post-actions');
    });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stop = await mount();
    Visibility.current.show(true);
    const loaded = import('../../src/lib/post-actions').catch(() => {});
    const enhanced = import('../../src/lib/post-enhancements').catch(() => {});
    stop();
    ready.resolve();
    await Promise.all([loaded, enhanced]);
    await Promise.resolve();
    expect(fetch).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
    expect(document.querySelector('[data-reaction-count]')!.textContent).toBe('—');
  },
);
