/**
 * Purpose: Light and dark theme handling.
 * Scope: The inline bootstrap script that applies a saved theme before paint, the storage key,
 *   theme resolution against the system preference, and the toggle button behavior (aria-pressed,
 *   persistence, following system changes until the visitor chooses).
 * Does NOT belong: Theme colors (src/styles/global.css) or the toggle's markup
 *   (src/components/ThemeToggle.astro).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readItem, writeItem, type StorageLike } from './storage';
import { preferenceStorage, CONSENT_KEY } from './consent';
import { releaseVersion } from './release-identity';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function readStoredTheme(storage: StorageLike | null): Theme | null {
  const value = readItem(storage, THEME_STORAGE_KEY);
  return isTheme(value) ? value : null;
}

export function resolveTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light');
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/**
 * Runs inline in <head> before the page paints, so a saved preference never
 * flashes the wrong theme. It also marks the document as JavaScript-capable,
 * which progressive enhancements (the mobile menu, reveal motion) rely on.
 * Without a saved choice, CSS follows the operating system setting.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');var warned=false;function fail(e){var s=e.target;if(!s||s.tagName!=='SCRIPT'||s.type!=='module')return;var shell=d.hasAttribute('data-site-ready'),timeline=document.querySelector('[data-timeline]');if(shell&&(!timeline||d.hasAttribute('data-timeline-ready'))){document.removeEventListener('error',fail,true);return;}if(!shell)d.classList.remove('js');if(timeline&&!d.hasAttribute('data-timeline-ready'))d.setAttribute('data-timeline-fallback','');d.removeAttribute('data-timeline-restore');if(!warned){warned=true;try{console.warn('[Daysforth]',{code:shell?'DF_TIMELINE_LOAD':'DF_SHELL_LOAD',component:shell?'timeline':'shell',category:'load',release:'${releaseVersion}'});}catch(e){}}}document.addEventListener('error',fail,true);try{var c=JSON.parse(localStorage.getItem('${CONSENT_KEY}')||'null');if(c&&c.allowed===true&&c.expires>Date.now()){var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);}}}catch(e){}var p=window.navigation?.currentEntry?.getState()?.scrollY;if(location.search.includes('date=')||(typeof p==='number'&&Number.isFinite(p)&&p>=0)){d.setAttribute('data-timeline-restore','');}})();`;

type ThemeWindow = Pick<Window, 'localStorage' | 'matchMedia'>;

/**
 * Wires every `[data-theme-toggle]` button. The button reports dark mode with
 * `aria-pressed`, and the choice is remembered for future visits.
 */
export function initThemeToggle(doc: Document, win: ThemeWindow): () => void {
  const root = doc.documentElement;
  const storage = preferenceStorage(win);
  const stored = readStoredTheme(storage);
  if (stored) root.dataset['theme'] = stored;
  const media = typeof win.matchMedia === 'function' ? win.matchMedia(DARK_SCHEME_QUERY) : null;
  const buttons = Array.from(doc.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]'));

  const currentTheme = (): Theme => {
    const explicit = root.dataset['theme'];
    return isTheme(explicit) ? explicit : resolveTheme(null, media?.matches ?? false);
  };

  const sync = () => {
    const isDark = currentTheme() === 'dark';
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(isDark));
    }
  };

  const onClick = () => {
    const next = oppositeTheme(currentTheme());
    root.dataset['theme'] = next;
    writeItem(storage, THEME_STORAGE_KEY, next);
    sync();
  };

  const onSystemChange = () => {
    if (!readStoredTheme(storage)) {
      delete root.dataset['theme'];
    }
    sync();
  };

  for (const button of buttons) {
    button.addEventListener('click', onClick);
  }
  media?.addEventListener('change', onSystemChange);
  sync();

  return () => {
    for (const button of buttons) {
      button.removeEventListener('click', onClick);
    }
    media?.removeEventListener('change', onSystemChange);
  };
}
