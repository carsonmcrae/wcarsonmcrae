/**
 * Purpose: Unit tests for src/lib/menu.ts.
 * Scope: Opening and closing the menu by button, Escape, outside click, focus, link choice, and
 *   viewport change, plus cleanup.
 * Does NOT belong: Browser checks of the real header (tests/e2e).
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initMenu } from '../../src/lib/menu';
import { disposeDocument, fakeMediaQuery } from './helpers';
const stops: (() => void)[] = [];

function setup({ withMatchMedia = true } = {}) {
  document.body.innerHTML = `
    <header>
      <button type="button" data-menu-toggle aria-controls="site-nav" aria-expanded="false">
        <span>Menu</span>
      </button>
      <nav id="site-nav"><a href="/about/">About</a><a href="/work/">Work</a></nav>
    </header>
    <main><button type="button" id="outside">Outside</button></main>`;
  const media = fakeMediaQuery(false);
  const win = {
    matchMedia: withMatchMedia ? () => media : undefined,
  } as unknown as Pick<Window, 'matchMedia'>;
  const menu = initMenu(document, win);
  stops.push(menu!.destroy);
  const button = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
  const panel = document.getElementById('site-nav')!;
  return { menu: menu!, media, button, panel };
}

afterEach(() => {
  disposeDocument(stops);
  vi.unstubAllGlobals();
});

describe('initMenu', () => {
  it('focuses Close on native opening and preserves visitor focus on an already-open drawer', () => {
    document.body.innerHTML =
      '<button data-menu-toggle aria-controls="drawer">Menu</button><dialog id="drawer"><a href="/">Brand</a><button data-menu-close>Close</button><a href="/about/">About</a></dialog>';
    const menu = initMenu(document, window)!;
    const close = document.querySelector('[data-menu-close]')!;
    menu.open();
    expect(document.activeElement).toBe(close);
    const brand = document.querySelector<HTMLAnchorElement>('dialog a')!;
    brand.focus();
    menu.open();
    expect(document.activeElement).toBe(brand);
    menu.close();
    menu.open();
    expect(document.activeElement).toBe(close);
    menu.destroy();
  });
  it('retains the native opening behavior if a dialog has no designated close control', () => {
    document.body.innerHTML =
      '<button data-menu-toggle aria-controls="drawer">Menu</button><dialog id="drawer"><a href="/">Home</a></dialog>';
    const menu = initMenu(document, window)!;
    menu.open();
    expect(document.querySelector('dialog')!.open).toBe(true);
    menu.destroy();
  });
  it('supports a native modal drawer, scrim, close action, and mobile swipes', () => {
    document.body.innerHTML =
      '<button data-menu-toggle aria-controls="drawer">Menu</button><dialog id="drawer"><button data-menu-close>Close</button><a href="/work/">Work</a></dialog><main><span>Gesture area</span></main>';
    const media = fakeMediaQuery(false);
    const menu = initMenu(document, {
      matchMedia: () => media as unknown as MediaQueryList,
    })!;
    const dialog = document.querySelector('dialog')!;
    const area = document.querySelector('span')!;
    const touch = (type: string, x?: number, y = 0, target: Element = area) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
        value: x === undefined ? [] : [{ clientX: x, clientY: y }],
      });
      target.dispatchEvent(event);
    };
    menu.open();
    menu.open();
    expect(dialog.open).toBe(true);
    dialog.querySelector('a')!.focus();
    expect(menu.isOpen()).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 0 }));
    expect(menu.isOpen()).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100 }));
    expect(dialog.open).toBe(false);
    menu.open();
    dialog.querySelector('button')!.click();
    expect(menu.isOpen()).toBe(false);
    menu.open();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(menu.isOpen()).toBe(false);
    dialog.dispatchEvent(new Event('click', { bubbles: true }));
    touch('touchend', 100);
    touch('touchstart');
    touch('touchstart', 10);
    touch('touchend', 100);
    expect(menu.isOpen()).toBe(false);
    touch('touchstart', 20, 0, document.querySelector('button')!);
    touch('touchend', 100);
    expect(menu.isOpen()).toBe(false);
    touch('touchstart', 20);
    touch('touchend');
    touch('touchstart', 20);
    touch('touchend', 40);
    touch('touchstart', 20);
    touch('touchend', 100, 200);
    touch('touchstart', 20);
    touch('touchend', -100);
    expect(menu.isOpen()).toBe(false);
    touch('touchstart', 20);
    touch('touchend', 100);
    expect(menu.isOpen()).toBe(true);
    touch('touchstart', 100);
    touch('touchend', 200);
    expect(menu.isOpen()).toBe(true);
    touch('touchstart', 200);
    touch('touchend', 100);
    expect(menu.isOpen()).toBe(false);
    document.querySelector<HTMLElement>('[data-menu-toggle]')!.style.display = 'none';
    media.change(true);
    touch('touchstart', 20);
    touch('touchend', 100);
    expect(menu.isOpen()).toBe(false);
    menu.destroy();
    touch('touchstart', 20);
    touch('touchend', 100);
    expect(dialog.open).toBe(false);
    document.querySelector<HTMLElement>('[data-menu-toggle]')!.style.display = '';
    const fallback = initMenu(document, { matchMedia: undefined } as unknown as Pick<
      Window,
      'matchMedia'
    >)!;
    touch('touchstart', 20);
    touch('touchend', 100);
    expect(fallback.isOpen()).toBe(true);
    fallback.destroy();
    vi.restoreAllMocks();
  });
  it('returns null when the markup is missing', () => {
    document.body.innerHTML = '<nav id="site-nav"></nav>';
    expect(initMenu(document, window)).toBeNull();
    document.body.innerHTML = '<button data-menu-toggle aria-controls="missing"></button>';
    expect(initMenu(document, window)).toBeNull();
    document.body.innerHTML = '<button data-menu-toggle></button>';
    expect(initMenu(document, window)).toBeNull();
  });

  it('starts closed and toggles with the button', () => {
    const { menu, button, panel } = setup();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('data-open')).toBe('false');

    button.click();
    expect(menu.isOpen()).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('data-open')).toBe('true');

    button.click();
    expect(menu.isOpen()).toBe(false);
  });

  it('closes on Escape and returns focus to the button', () => {
    const { menu, button } = setup();
    menu.open();
    document.querySelector<HTMLAnchorElement>('#site-nav a')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('ignores other keys and Escape while closed', () => {
    const { menu } = setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.isOpen()).toBe(false);
    menu.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(menu.isOpen()).toBe(true);
  });

  it('closes when a navigation link is chosen', () => {
    const { menu, panel } = setup();
    menu.open();
    panel.click(); // a click on the panel itself, not a link, keeps it open
    expect(menu.isOpen()).toBe(true);
    document.querySelector<HTMLAnchorElement>('#site-nav a')!.click();
    expect(menu.isOpen()).toBe(false);
  });

  it('closes on outside clicks and when focus leaves the menu', () => {
    const { menu } = setup();
    const outside = document.getElementById('outside')!;
    menu.open();
    outside.click();
    expect(menu.isOpen()).toBe(false);

    menu.open();
    document.querySelector<HTMLAnchorElement>('#site-nav a')!.focus();
    expect(menu.isOpen()).toBe(true);
    outside.focus();
    expect(menu.isOpen()).toBe(false);
  });

  it('ignores outside clicks and focus while already closed', () => {
    const { menu } = setup();
    const outside = document.getElementById('outside')!;
    outside.click();
    outside.focus();
    expect(menu.isOpen()).toBe(false);
    menu.close();
    expect(menu.isOpen()).toBe(false);
  });

  it('closes when the viewport grows to the desktop layout', () => {
    const { menu, media, button } = setup();
    menu.open();
    media.change(false);
    expect(menu.isOpen()).toBe(true);
    button.style.display = 'none';
    media.change(true);
    expect(menu.isOpen()).toBe(false);
  });

  it('follows the visible container layout when enlarged text disagrees with the viewport query', () => {
    let resized!: ResizeObserverCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resized = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { menu, button, media } = setup();
    menu.open();
    media.change(true);
    expect(menu.isOpen()).toBe(true);
    expect(observe).toHaveBeenCalledWith(button);
    button.style.display = 'none';
    resized([], {} as ResizeObserver);
    expect(menu.isOpen()).toBe(false);
    menu.destroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('keeps native viewport notifications usable when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { menu, button, media } = setup();
    menu.open();
    button.style.display = 'none';
    media.change(true);
    expect(menu.isOpen()).toBe(false);
  });

  it('can toggle programmatically and works without matchMedia', () => {
    const { menu } = setup({ withMatchMedia: false });
    menu.toggle();
    expect(menu.isOpen()).toBe(true);
    menu.toggle();
    expect(menu.isOpen()).toBe(false);
  });

  it('removes its listeners on destroy', () => {
    const { menu, button, media } = setup();
    menu.destroy();
    button.click();
    expect(menu.isOpen()).toBe(false);
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});
