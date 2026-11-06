/**
 * Purpose: Unit tests for src/lib/theme.ts.
 * Scope: Theme helpers, the inline bootstrap script, and the toggle buttons' state, persistence,
 *   and system-change behavior.
 * Does NOT belong: Browser checks of the real page (tests/e2e).
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clearPreferences, CONSENT_KEY } from '../../src/lib/consent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  initThemeToggle,
  isTheme,
  oppositeTheme,
  readStoredTheme,
  resolveTheme,
} from '../../src/lib/theme';
import { fakeMediaQuery, consentingStorage, throwingStorage } from './helpers';

function setup(options: { prefersDark?: boolean; stored?: string; withMatchMedia?: boolean } = {}) {
  document.body.innerHTML = `
    <button type="button" data-theme-toggle aria-pressed="false">Dark mode</button>
    <button type="button" data-theme-toggle aria-pressed="false">Dark mode</button>`;
  const storage = consentingStorage(options.stored ? { [THEME_STORAGE_KEY]: options.stored } : {});
  const media = fakeMediaQuery(options.prefersDark ?? false);
  const win = {
    localStorage: storage,
    matchMedia: options.withMatchMedia === false ? undefined : () => media,
  } as unknown as Pick<Window, 'localStorage' | 'matchMedia'>;
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]'));
  return { storage, media, win, buttons };
}

beforeEach(() => {
  clearPreferences(null);
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.className = '';
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('theme helpers', () => {
  it('recognizes valid themes', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('sepia')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('prefers a stored choice over the system setting', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('flips between themes', () => {
    expect(oppositeTheme('light')).toBe('dark');
    expect(oppositeTheme('dark')).toBe('light');
  });

  it('ignores invalid or unreadable stored values', () => {
    expect(readStoredTheme(consentingStorage({ [THEME_STORAGE_KEY]: 'neon' }))).toBeNull();
    expect(readStoredTheme(consentingStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
    expect(readStoredTheme(throwingStorage())).toBeNull();
    expect(readStoredTheme(null)).toBeNull();
  });
});

describe('THEME_BOOTSTRAP_SCRIPT', () => {
  const run = () => new Function(THEME_BOOTSTRAP_SCRIPT)();
  it('marks native entry restoration before paint even without a date query', () => {
    const getState = vi.fn();
    vi.stubGlobal('navigation', { currentEntry: { getState } });
    for (const scrollY of [740, 0]) {
      document.documentElement.removeAttribute('data-timeline-restore');
      getState.mockReturnValue({ scrollY });
      run();
      expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(true);
    }
    for (const scrollY of [-1, NaN, Infinity, '740']) {
      document.documentElement.removeAttribute('data-timeline-restore');
      getState.mockReturnValue({ scrollY });
      run();
      expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(false);
    }
  });

  it('marks the document as JavaScript-enabled', () => {
    localStorage.clear();
    run();
    expect(document.documentElement.classList.contains('js')).toBe(true);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('restores the native shell for a failed initial module, but preserves unrelated enhancements after readiness', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete document.documentElement.dataset['siteReady'];
    run();
    const image = document.createElement('img');
    const script = document.createElement('script');
    script.type = 'module';
    document.body.append(image, script);
    image.dispatchEvent(new Event('error'));
    expect(document.documentElement.classList.contains('js')).toBe(true);
    document.documentElement.dataset['timelineRestore'] = '';
    script.dispatchEvent(new Event('error'));
    expect(document.documentElement.classList.contains('js')).toBe(false);
    expect(document.documentElement.hasAttribute('data-timeline-restore')).toBe(false);
    run();
    document.documentElement.dataset['siteReady'] = 'true';
    script.dispatchEvent(new Event('error'));
    expect(document.documentElement.classList.contains('js')).toBe(true);
    delete document.documentElement.dataset['siteReady'];
    vi.restoreAllMocks();
  });

  it('falls back only the unready timeline when another initial module fails after shell readiness', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<section data-timeline></section><script type="module"></script>';
    document.documentElement.dataset['siteReady'] = 'true';
    delete document.documentElement.dataset['timelineReady'];
    run();
    document.querySelector('script')!.dispatchEvent(new Event('error'));
    expect(document.documentElement.classList.contains('js')).toBe(true);
    expect(document.documentElement.hasAttribute('data-timeline-fallback')).toBe(true);
    delete document.documentElement.dataset['timelineFallback'];
    document.documentElement.dataset['timelineReady'] = 'true';
    document.querySelector('script')!.dispatchEvent(new Event('error'));
    expect(document.documentElement.hasAttribute('data-timeline-fallback')).toBe(false);
    delete document.documentElement.dataset['siteReady'];
    delete document.documentElement.dataset['timelineReady'];
    vi.restoreAllMocks();
  });

  it('applies a saved theme before paint', () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ allowed: true, expires: Number.MAX_SAFE_INTEGER }),
    );
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    run();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    localStorage.clear();
  });

  it('ignores unexpected saved values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"><script>');
    run();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    localStorage.clear();
  });
});

describe('initThemeToggle', () => {
  it('restores a permitted saved choice when initialization follows native navigation', () => {
    const { win, buttons } = setup({ stored: 'dark' });
    initThemeToggle(document, win);
    expect(buttons[0]!.getAttribute('aria-pressed')).toBe('true');
  });
  it('reflects the system preference when nothing is stored', () => {
    const { win, buttons } = setup({ prefersDark: true });
    initThemeToggle(document, win);
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true);
  });

  it('toggles, persists, and syncs every toggle button', () => {
    const { win, buttons, storage } = setup();
    initThemeToggle(document, win);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');

    buttons[0]?.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true);

    buttons[1]?.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('respects an explicit theme already applied by the bootstrap script', () => {
    const { win, buttons } = setup({ prefersDark: false });
    document.documentElement.setAttribute('data-theme', 'dark');
    initThemeToggle(document, win);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('follows system changes only when the visitor has not chosen', () => {
    const { win, media, buttons } = setup();
    initThemeToggle(document, win);
    media.change(true);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');

    buttons[0]?.click(); // explicit choice: light
    media.change(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('works without matchMedia and cleans up its listeners', () => {
    const { win, buttons } = setup({ withMatchMedia: false });
    const cleanup = initThemeToggle(document, win);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');
    cleanup();
    buttons[0]?.click();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('removes the system listener on cleanup', () => {
    const { win, media } = setup();
    const cleanup = initThemeToggle(document, win);
    cleanup();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
