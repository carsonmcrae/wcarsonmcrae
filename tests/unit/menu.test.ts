/**
 * Purpose: Unit tests for src/lib/menu.ts.
 * Scope: Opening and closing the menu by button, Escape, outside click, focus, link choice, and
 *   viewport change, plus cleanup.
 * Does NOT belong: Browser checks of the real header (tests/e2e).
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { initMenu } from '../../src/lib/menu';
import { fakeMediaQuery } from './helpers';

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
  const button = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
  const panel = document.getElementById('site-nav')!;
  return { menu: menu!, media, button, panel };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('initMenu', () => {
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
    const { menu, media } = setup();
    menu.open();
    media.change(false);
    expect(menu.isOpen()).toBe(true);
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
