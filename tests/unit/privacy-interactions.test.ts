/**
 * Purpose: Protect consent, photo-viewer, history, and native restoration behavior.
 * Scope: Default-off persistence, withdrawal/erasure, modal focus, and native navigation availability.
 * Does NOT belong: Real network requests or layout assertions.
 * @vitest-environment happy-dom
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
import { initPagePosition, prepareTimelineRestore } from '../../src/lib/page-position';
import { consentingStorage, memoryStorage } from './helpers';
const stops: (() => void)[] = [];
beforeEach(() => {
  clearPreferences(null);
  document.body.innerHTML = '';
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  document.body.innerHTML = '';
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
  it('forgets a browser identity without requesting any aggregate reaction deletion', async () => {
    const f = privacyFixture(
      consentingStorage({ 'daysforth.visitor': '12345678-1234-4234-8234-123456789abc' }),
    );
    f.click('[data-forget-browser]');
    await vi.waitFor(() =>
      expect(document.querySelector('[data-storage-feedback]')!.textContent).toContain(
        'data cleared',
      ),
    );
    expect(f.fetcher).toHaveBeenCalledWith(
      'https://api.example.com/identity',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    expect(consentChoice(f.raw)).toBe(false);
  });
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
          'could not be removed',
        ),
      );
      expect(f.raw.getItem('daysforth.visitor')).toBeNull();
    },
  );
  it('can clear a browser without an identifier or without a configured service', async () => {
    const empty = privacyFixture();
    empty.click('[data-forget-browser]');
    expect(empty.fetcher).not.toHaveBeenCalled();
    empty.stop();
    const local = privacyFixture(consentingStorage({ 'daysforth.visitor': 'id' }), vi.fn(), '');
    local.click('[data-forget-browser]');
    expect(local.fetcher).not.toHaveBeenCalled();
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
    link.click();
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
describe('returning to the timeline', () => {
  it('gives valid recorded positions exclusive restoration ownership, including the top', () => {
    const history = { state: null as unknown, scrollRestoration: 'auto' };
    const win = { history } as Pick<Window, 'history'>;
    expect(prepareTimelineRestore(win)).toBeNull();
    for (const position of ['500', NaN, Infinity, -1]) {
      history.state = { scrollY: position };
      expect(prepareTimelineRestore(win)).toBeNull();
      expect(history.scrollRestoration).toBe('auto');
    }
    for (const position of [500, 0]) {
      history.state = { scrollY: position };
      expect(prepareTimelineRestore(win)).toBe(position);
      expect(history.scrollRestoration).toBe('manual');
    }
  });
  it('uses same-origin native entries when the strict referrer policy hides the prior URL', () => {
    document.body.innerHTML =
      '<a href="https://daysforth.com/?date=2022-05" data-return-timeline>Back</a>';
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    const entries = [
      { index: 0, url: 'https://daysforth.com/?date=2022-05' },
      { index: 1, url: 'https://daysforth.com/posts/born/' },
    ];
    const win = {
      navigation: { currentEntry: { index: 1 }, entries: () => entries },
      history: { length: 2, back: vi.fn(), replaceState: vi.fn() },
      scrollY: 500,
      location: { origin: 'https://daysforth.com' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Parameters<typeof initPagePosition>[1];
    stops.push(initPagePosition(document, win));
    const link = document.querySelector('a')!;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
    win.navigation!.currentEntry!.index = 4;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
    win.navigation!.currentEntry = null;
    link.click();
    expect(win.history.back).toHaveBeenCalledOnce();
  });
  it('uses native back when a post came from the timeline and records only browser-history scroll state', () => {
    document.body.innerHTML =
      '<a href="https://daysforth.com/?date=2018-05" data-return-timeline><span>Back</span></a><button>Other</button>';
    Object.defineProperty(document, 'referrer', {
      value: 'https://daysforth.com/?date=2018-05',
      configurable: true,
    });
    const events = new EventTarget();
    const history = { state: { index: 2 }, length: 2, back: vi.fn(), replaceState: vi.fn() };
    const win = {
      history,
      location: { origin: 'https://daysforth.com' },
      scrollY: 500,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    } as unknown as Parameters<typeof initPagePosition>[1];
    const stop = initPagePosition(document, win);
    stops.push(stop);
    document.querySelector('span')!.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    events.dispatchEvent(new Event('pagehide'));
    expect(history.replaceState).toHaveBeenCalledWith({ index: 2, scrollY: 500 }, '');
    const link = document.querySelector('a')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, altKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }));
    document.dispatchEvent(new MouseEvent('click'));
    document.querySelector('button')!.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'referrer', {
      value: 'https://other.example.com/',
      configurable: true,
    });
    link.click();
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    link.click();
    Object.defineProperty(document, 'referrer', {
      value: 'https://daysforth.com/life/',
      configurable: true,
    });
    link.click();
    history.length = 1;
    link.click();
    expect(history.back).toHaveBeenCalledTimes(1);
    document.querySelector('button')!.setAttribute('data-history', 'back');
    document.querySelector('button')!.click();
    const recorded = history.replaceState.mock.calls.length;
    stop();
    link.click();
    expect(history.replaceState).toHaveBeenCalledTimes(recorded);
  });
});
