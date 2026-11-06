/**
 * Purpose: Protect consent, photo-viewer, history, and native navigation availability.
 * Scope: Default-off persistence, withdrawal/erasure, modal focus, and native navigation availability.
 * Does NOT belong: Real network requests or layout assertions.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_KEY,
  clearPreferences,
  consentChoice,
  preferenceStorage,
  recordConsent,
} from '../../src/lib/consent';
import { initPrivacyControls } from '../../src/lib/privacy-controls';
import { initPhotoViewer } from '../../src/lib/photo-viewer';
import { initHistoryControls } from '../../src/lib/history-controls';
import { consentingStorage, memoryStorage } from './helpers';
const stops: (() => void)[] = [];
beforeEach(() => {
  clearPreferences(null);
  document.body.innerHTML = '';
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('optional storage', () => {
  it('uses only memory until explicit permission, then promotes choices and supports withdrawal', () => {
    const raw = memoryStorage({ theme: 'old', unrelated: 'keep' });
    const data = preferenceStorage({ localStorage: raw });
    expect(data.getItem('theme')).toBeNull();
    data.setItem('theme', 'dark');
    expect(raw.getItem('theme')).toBe('old');
    expect(data.getItem('theme')).toBe('dark');
    expect(recordConsent(raw, true)).toBe(true);
    expect(raw.getItem('theme')).toBe('dark');
    data.setItem('saved', 'yes');
    expect(data.getItem('saved')).toBe('yes');
    raw.setItem('daysforth.saved.born', 'true');
    raw.setItem('cm:visited-pages', '[]');
    clearPreferences(raw);
    expect(raw.getItem('theme')).toBeNull();
    expect(raw.getItem('daysforth.saved.born')).toBeNull();
    expect(raw.getItem('cm:visited-pages')).toBeNull();
    expect(raw.getItem('unrelated')).toBe('keep');
    expect(raw.getItem(CONSENT_KEY)).toBeTruthy();
    recordConsent(raw, false);
    expect(consentChoice(raw)).toBe(false);
    expect(data.getItem('theme')).toBeNull();
  });
  it.each([
    '{',
    'null',
    '0',
    '{}',
    '{"allowed":"yes","expires":999}',
    '{"allowed":true}',
    '{"allowed":true,"expires":"later"}',
    '{"allowed":true,"expires":1}',
  ])('ignores an invalid or expired decision: %s', (value) =>
    expect(consentChoice(memoryStorage({ [CONSENT_KEY]: value }), 10)).toBeNull(),
  );
  it('works with blocked storage and reports failures after a previously allowed store fills up', () => {
    const win = {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    };
    const ephemeral = preferenceStorage(win);
    ephemeral.setItem('choice', 'yes');
    expect(ephemeral.getItem('choice')).toBe('yes');
    expect(recordConsent(null, true)).toBe(false);
    const raw = consentingStorage();
    const data = preferenceStorage({ localStorage: raw });
    vi.spyOn(raw, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(() => data.setItem('key', 'value')).toThrow('Storage unavailable');
  });

  it.each([true, false])(
    'keeps page choices and fails closed when promotion fails (revocation writable %s)',
    (writable) => {
      const raw = memoryStorage();
      const preferences = preferenceStorage({ localStorage: raw });
      preferences.setItem('theme', 'dark');
      preferences.setItem('daysforth.saved.born', 'true');
      const write = raw.setItem.bind(raw);
      vi.spyOn(raw, 'setItem').mockImplementation((key, value) => {
        if (
          key === 'daysforth.saved.born' ||
          (!writable && key === CONSENT_KEY && JSON.parse(value).allowed === false)
        )
          throw new Error('storage full');
        write(key, value);
      });
      expect(recordConsent(raw, true)).toBe(false);
      expect(consentChoice(raw)).toBe(false);
      expect(preferences.getItem('daysforth.saved.born')).toBe('true');
      expect(preferences.getItem('theme')).toBe('dark');
      expect(JSON.parse(raw.getItem(CONSENT_KEY)!).allowed).toBe(!writable);
      clearPreferences(raw);
      expect(preferences.getItem('daysforth.saved.born')).toBeNull();
      expect(preferences.getItem('theme')).toBeNull();
      expect(raw.getItem('theme')).toBeNull();
    },
  );
});
function privacyFixture(
  raw = memoryStorage(),
  fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ forgotten: true })),
  endpoint = 'https://api.example.com',
) {
  document.body.innerHTML =
    '<button data-storage-open>Settings</button><aside data-storage-notice hidden></aside><dialog data-storage-dialog><p data-storage-status></p><button data-storage-choice="yes">Allow</button><button data-storage-choice="no">Off</button><button data-forget-browser>Forget</button><button data-storage-close>Close</button><p data-storage-feedback></p></dialog><button id="outside">Outside</button>';
  const stop = initPrivacyControls(document, { localStorage: raw, fetch: fetcher }, endpoint);
  stops.push(stop);
  const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!.click();
  return {
    raw,
    fetcher,
    stop,
    click,
    dialog: document.querySelector('dialog')!,
    notice: document.querySelector<HTMLElement>('aside')!,
  };
}
describe('privacy choices', () => {
  it('discloses default-off storage, accepts a deliberate choice, and lets visitors withdraw it', () => {
    const f = privacyFixture();
    expect(f.notice.hidden).toBe(false);
    document.dispatchEvent(new MouseEvent('click'));
    document
      .querySelector('[data-storage-status]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.click('#outside');
    f.click('[data-storage-open]');
    expect(f.dialog.open).toBe(true);
    f.click('[data-storage-close]');
    expect(f.dialog.open).toBe(false);
    document.dispatchEvent(new CustomEvent('daysforth:privacy-request'));
    expect(f.dialog.open).toBe(true);
    f.click('[data-storage-choice="yes"]');
    expect(consentChoice(f.raw)).toBe(true);
    expect(f.notice.hidden).toBe(true);
    expect(f.dialog.open).toBe(false);
    f.raw.setItem('daysforth.saved.born', 'true');
    f.click('[data-storage-open]');
    f.click('[data-storage-choice="no"]');
    expect(f.raw.getItem('daysforth.saved.born')).toBeNull();
    expect(consentChoice(f.raw)).toBe(false);
    f.stop();
    f.click('[data-storage-open]');
    document.dispatchEvent(new CustomEvent('daysforth:privacy-request'));
    expect(f.dialog.open).toBe(false);
  });
  it('reports an unrecordable choice instead of claiming persistence', () => {
    const raw = memoryStorage();
    vi.spyOn(raw, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const f = privacyFixture(raw);
    f.click('[data-storage-choice="yes"]');
    expect(f.dialog.open).toBe(true);
    f.click('[data-storage-open]');
    f.click('[data-storage-choice="yes"]');
    expect(f.dialog.open).toBe(true);
    expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
      'could not remember',
    );
  });

  it('reports a failed grant promotion as off while keeping the existing page bookmark usable', () => {
    const f = privacyFixture();
    const preferences = preferenceStorage({ localStorage: f.raw });
    preferences.setItem('daysforth.saved.born', 'true');
    const write = f.raw.setItem.bind(f.raw);
    vi.spyOn(f.raw, 'setItem').mockImplementation((key, value) => {
      if (key === 'daysforth.saved.born') throw new Error('storage full');
      write(key, value);
    });
    f.click('[data-storage-choice="yes"]');
    expect(consentChoice(f.raw)).toBe(false);
    expect(document.querySelector('[data-storage-status]')!.textContent).toBe(
      'Optional storage is off.',
    );
    expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
      'could not remember your choice',
    );
    expect(preferences.getItem('daysforth.saved.born')).toBe('true');
  });
  it('forgets a browser identity without requesting any aggregate reaction deletion', async () => {
    const f = privacyFixture(
      consentingStorage({ 'daysforth.visitor': '12345678-1234-4234-8234-123456789abc' }),
    );
    f.click('[data-forget-browser]');
    await vi.waitFor(() =>
      expect(document.querySelector('[data-storage-feedback]')!.textContent).toBe(
        'Saved browser data cleared. Reaction counts stay.',
      ),
    );
    expect(f.fetcher).toHaveBeenCalledWith(
      'https://api.example.com/identity',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    expect(consentChoice(f.raw)).toBe(false);
  });
  it.each([null, false])(
    'erases the existing memory-only identity with consent %s',
    async (choice) => {
      const f = privacyFixture();
      if (choice !== null) recordConsent(f.raw, choice);
      const preferences = preferenceStorage({ localStorage: f.raw });
      const visitorId = '12345678-1234-4234-8234-123456789abc';
      preferences.setItem('daysforth.visitor', visitorId);
      preferences.setItem('daysforth.reacted.born', 'true');
      expect(f.raw.getItem('daysforth.visitor')).toBeNull();
      f.click('[data-forget-browser]');
      await vi.waitFor(() => expect(preferences.getItem('daysforth.visitor')).toBeNull());
      expect(f.fetcher).toHaveBeenCalledExactlyOnceWith('https://api.example.com/identity', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        signal: expect.any(AbortSignal),
      });
      expect(preferences.getItem('daysforth.reacted.born')).toBeNull();
      expect(f.raw.getItem('daysforth.visitor')).toBeNull();
      expect(consentChoice(f.raw)).toBe(false);
    },
  );
  it.each(['rejected', 'offline'])(
    'clears local data honestly when identifier erasure is %s',
    async (mode) => {
      const fetcher = vi.fn<typeof fetch>();
      if (mode === 'offline') fetcher.mockRejectedValue(new Error('offline'));
      else fetcher.mockResolvedValue(new Response(null, { status: 503 }));
      const f = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), fetcher);
      f.click('[data-forget-browser]');
      await vi.waitFor(() =>
        expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
          'removal could not be confirmed',
        ),
      );
      expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    },
  );
  it.each(['null', 'true', '{}', '{"forgotten":false}', '{"forgotten":"true"}', 'not JSON', ''])(
    'requires a valid erasure acknowledgement instead of trusting a 200 body: %s',
    async (body) => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 }));
      const f = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), fetcher);
      f.click('[data-forget-browser]');
      await vi.waitFor(() =>
        expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
          'removal could not be confirmed',
        ),
      );
      expect(f.raw.getItem('daysforth.visitor')).toBeNull();
      expect(consentChoice(f.raw)).toBe(false);
    },
  );
  it('bounds erasure acknowledgement body parsing with the same five-second deadline', async () => {
    vi.useFakeTimers();
    let body!: ReadableStreamDefaultController<Uint8Array>;
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start: (stream) => {
          body = stream;
        },
      }),
    );
    const read = vi.spyOn(response, 'json');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);
    const f = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), fetcher);
    f.click('[data-forget-browser]');
    expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    expect(consentChoice(f.raw)).toBe(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(read).toHaveBeenCalledOnce();
    const signal = fetcher.mock.calls[0]![1]!.signal!;
    const feedback = document.querySelector('[data-storage-feedback]')!;
    await vi.advanceTimersByTimeAsync(4999);
    expect(signal.aborted).toBe(false);
    expect(feedback.textContent).toContain('Checking');
    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(true);
    expect(feedback.textContent).toContain('removal could not be confirmed');
    expect(vi.getTimerCount()).toBe(0);
    const expired = feedback.textContent;
    body.enqueue(new TextEncoder().encode('{"forgotten":true}'));
    body.close();
    await read.mock.results[0]!.value;
    expect(feedback.textContent).toBe(expired);
  });
  it('clears browser choices immediately and bounds an unresponsive erasure request', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {}));
    const f = privacyFixture(
      consentingStorage({ 'daysforth.visitor': 'id', 'daysforth.saved.born': 'true' }),
      fetcher,
    );
    f.click('[data-forget-browser]');
    expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    expect(f.raw.getItem('daysforth.saved.born')).toBeNull();
    expect(consentChoice(f.raw)).toBe(false);
    const signal = fetcher.mock.calls[0]![1]!.signal!;
    const feedback = document.querySelector('[data-storage-feedback]')!;
    expect(feedback.textContent).toContain('Checking');
    await vi.advanceTimersByTimeAsync(4999);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(true);
    expect(feedback.textContent).toContain('removal could not be confirmed');
  });
  it('aborts erasure on disposal without allowing its late response to change feedback', async () => {
    vi.useFakeTimers();
    let finish!: (response: Response) => void;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const f = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), fetcher);
    f.click('[data-forget-browser]');
    const feedback = document.querySelector('[data-storage-feedback]')!;
    const original = feedback.textContent;
    f.stop();
    expect(fetcher.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    finish(Response.json({ forgotten: true }));
    await vi.advanceTimersByTimeAsync(0);
    expect(feedback.textContent).toBe(original);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('can clear a browser without an identifier or without a configured service', async () => {
    const empty = privacyFixture();
    empty.click('[data-forget-browser]');
    expect(empty.fetcher).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-storage-feedback]')!.textContent).toBe(
        'Saved browser data cleared. Reaction counts stay.',
      ),
    );
    empty.stop();
    const local = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), vi.fn(), '');
    local.click('[data-forget-browser]');
    expect(local.fetcher).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
        'removal could not be confirmed',
      ),
    );
    expect(local.raw.getItem('daysforth.visitor')).toBeNull();
  });
});
describe('large photos', () => {
  it('opens a full-size image with its caption and related moment, then returns focus', () => {
    document.body.innerHTML =
      '<a href="https://daysforth.com/photo.webp" data-photo data-photo-caption="A caption" data-photo-post="/posts/example/"><img alt="A portrait"></a><dialog data-photo-viewer><button data-photo-close>Close</button><img data-photo-large><figcaption data-photo-caption-output></figcaption><a data-photo-related hidden></a></dialog><button id="other">Other</button>';
    const stop = initPhotoViewer(document);
    stops.push(stop);
    const link = document.querySelector('a')!;
    const dialog = document.querySelector('dialog')!;
    document.dispatchEvent(new MouseEvent('click'));
    document.querySelector<HTMLButtonElement>('#other')!.click();
    document.querySelector<HTMLButtonElement>('[data-photo-close]')!.click();
    window.scrollTo({ top: 420, left: 12 });
    const scroll = vi.spyOn(window, 'scrollTo');
    link.click();
    expect(scroll).toHaveBeenLastCalledWith({ top: 420, left: 12, behavior: 'instant' });
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('img')!.src).toBe('https://daysforth.com/photo.webp');
    expect(dialog.querySelector('img')!.alt).toBe('A portrait');
    expect(dialog.querySelector('figcaption')!.textContent).toBe('A caption');
    expect(dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!.hidden).toBe(false);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(link);
    expect(dialog.querySelector('img')!.hasAttribute('src')).toBe(false);
    delete link.dataset['photoPost'];
    delete link.dataset['photoCaption'];
    link.click();
    expect(dialog.querySelector('figcaption')!.textContent).toBe('A portrait');
    expect(dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!.hidden).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(false);
    const card = document.createElement('div');
    document.body.append(card);
    card.append(link);
    card.insertAdjacentHTML(
      'beforeend',
      '<a class="post-media__open" href="/posts/example/">View</a>',
    );
    link.click();
    expect(dialog.querySelector<HTMLAnchorElement>('[data-photo-related]')!.href).toContain(
      '/posts/example/',
    );
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    stop();
    link.click();
    expect(dialog.open).toBe(false);
  });
});
describe('header history', () => {
  it('tracks native browser availability, traverses it, and removes listeners', () => {
    document.body.innerHTML =
      '<button data-history="back"></button><button data-history="forward"></button>';
    const navigation = Object.assign(new EventTarget(), { canGoBack: false, canGoForward: false });
    const events = new EventTarget();
    const history = { state: { index: 0 }, back: vi.fn(), forward: vi.fn() };
    const win = {
      history,
      navigation,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    } as unknown as Parameters<typeof initHistoryControls>[1];
    const stop = initHistoryControls(document, win);
    stops.push(stop);
    const back = document.querySelector<HTMLButtonElement>('[data-history="back"]')!;
    const forward = document.querySelector<HTMLButtonElement>('[data-history="forward"]')!;
    expect(back.disabled).toBe(true);
    expect(forward.disabled).toBe(true);
    navigation.canGoBack = true;
    navigation.canGoForward = true;
    navigation.dispatchEvent(new Event('currententrychange'));
    back.click();
    forward.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    expect(history.forward).toHaveBeenCalledTimes(1);
    stop();
    navigation.canGoBack = false;
    navigation.dispatchEvent(new Event('currententrychange'));
    back.click();
    expect(back.disabled).toBe(false);
    expect(history.back).toHaveBeenCalledTimes(1);
  });
  it('uses the known index range when the Navigation API is unavailable', () => {
    document.body.innerHTML =
      '<button data-history="back"></button><button data-history="forward"></button>';
    const events = new EventTarget();
    const history = {
      state: null as { index: number } | null,
      length: 1,
      back: vi.fn(),
      forward: vi.fn(),
    };
    const win = {
      history,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    } as unknown as Parameters<typeof initHistoryControls>[1];
    stops.push(initHistoryControls(document, win));
    expect(document.querySelector<HTMLButtonElement>('[data-history="back"]')!.disabled).toBe(true);
    history.length = 2;
    events.dispatchEvent(new Event('pageshow'));
    expect(document.querySelector<HTMLButtonElement>('[data-history="forward"]')!.disabled).toBe(
      false,
    );
    history.state = { index: 7 };
    events.dispatchEvent(new Event('popstate'));
    history.state = { index: 3 };
    document.dispatchEvent(new CustomEvent('daysforth:history'));
    expect(document.querySelector<HTMLButtonElement>('[data-history="forward"]')!.disabled).toBe(
      false,
    );
  });
});
