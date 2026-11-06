/**
 * Purpose: Protect geometry-qualified shortcuts and deliberate touch media affordances.
 * Scope: User intent, feed edges, modal-safe input handling, direct links, and complete cleanup.
 * Does NOT belong: Browser pixels, date state, or photo viewer contents.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { readTimelineViewport } from '../../src/lib/timeline-viewport';
import { initTimelineJumps } from '../../src/lib/timeline-jumps';
import { initMediaAffordances } from '../../src/lib/media-affordances';

const stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  document.body.innerHTML = '';
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

function timeline() {
  document.body.innerHTML =
    '<header class="site-header"></header><section data-timeline><div class="timeline-dock"><div class="timeline-jumps"><button data-timeline-edge="newest" hidden></button></div></div><div data-timeline-groups></div></section><div class="timeline-jumps"><button data-timeline-edge="oldest" hidden></button></div><input>';
  const root = document.querySelector<HTMLElement>('[data-timeline]')!;
  const geometry = {
    header: 56,
    dock: 250,
    top: 600,
    bottom: 2400,
    contentTop: 800,
    contentBottom: 2400,
    height: 1600,
  };
  const rect = (element: Element, value: () => { top: number; bottom: number; height?: number }) =>
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => value() as DOMRect);
  rect(document.querySelector('header')!, () => ({ top: 0, bottom: geometry.header }));
  rect(document.querySelector('.timeline-dock')!, () => ({ top: 56, bottom: geometry.dock }));
  rect(root, () => ({ top: geometry.top, bottom: geometry.bottom }));
  rect(root.querySelector('[data-timeline-groups]')!, () => ({
    top: geometry.contentTop,
    bottom: geometry.contentBottom,
    height: geometry.height,
  }));
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  const [up, down] = Array.from(document.querySelectorAll('button')) as [
    HTMLButtonElement,
    HTMLButtonElement,
  ];
  const scroll = (value: number) => {
    window.scrollTo(0, value);
    window.dispatchEvent(new Event('scroll'));
  };
  return { root, geometry, up, down, scroll, isHidden: () => up.hidden && down.hidden };
}

it('shares geometry that excludes the profile, empty feed, footer and offscreen header', () => {
  const f = timeline();
  expect(readTimelineViewport(f.root, window).inside).toBe(false);
  Object.assign(f.geometry, { top: 50, contentTop: 250 });
  expect(readTimelineViewport(f.root, window)).toEqual({
    inside: true,
    atStart: true,
    atEnd: false,
    readingTop: 250,
    dockVisible: true,
  });
  Object.assign(f.geometry, { contentTop: -50, contentBottom: 780 });
  expect(readTimelineViewport(f.root, window)).toEqual({
    inside: true,
    atStart: false,
    atEnd: true,
    readingTop: 250,
    dockVisible: true,
  });
  f.geometry.height = 0;
  expect(readTimelineViewport(f.root, window).inside).toBe(false);
  Object.assign(f.geometry, { height: 800, bottom: 30 });
  expect(readTimelineViewport(f.root, window).inside).toBe(false);
  Object.assign(f.geometry, { header: -10, dock: -5, top: -800, bottom: 700 });
  expect(readTimelineViewport(f.root, window).readingTop).toBe(0);
});

it('has no shortcuts to initialize on other pages or without their controls', () => {
  const listen = vi.spyOn(window, 'addEventListener');
  const input = vi.spyOn(document, 'addEventListener');
  stops.push(initTimelineJumps(document, window), initMediaAffordances(document, window));
  document.body.innerHTML = '<section data-timeline></section>';
  stops.push(initTimelineJumps(document, window));
  document.querySelector('[data-timeline]')!.innerHTML = '<button data-timeline-edge="newest">';
  stops.push(initTimelineJumps(document, window));
  expect(listen).not.toHaveBeenCalled();
  expect(input).not.toHaveBeenCalled();
  expect(document.querySelector('[data-timeline-edge="newest"]')!.textContent).toBe('');
});

it('ignores layout/date jumps, qualifies actual scrolling, and suppresses useless edge directions', () => {
  const f = timeline();
  const stop = initTimelineJumps(document, window);
  stops.push(stop);
  window.dispatchEvent(new Event('wheel'));
  f.scroll(100);
  expect(f.isHidden()).toBe(true);
  window.dispatchEvent(new Event('scrollend'));
  Object.assign(f.geometry, { top: 50, contentTop: 260 });
  f.scroll(700);
  expect(f.isHidden()).toBe(true);
  window.dispatchEvent(new Event('wheel'));
  f.scroll(700);
  expect(f.isHidden()).toBe(true);
  f.scroll(710);
  expect([f.up.hidden, f.down.hidden]).toEqual([true, false]);
  window.dispatchEvent(new Event('scrollend'));
  f.geometry.top = 100;
  f.scroll(720);
  expect(f.isHidden()).toBe(true);
  f.geometry.top = 50;
  f.scroll(730);
  expect([f.up.hidden, f.down.hidden]).toEqual([true, false]);
  window.dispatchEvent(new Event('wheel'));
  f.geometry.contentTop = 100;
  f.scroll(800);
  expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
  f.geometry.contentBottom = 780;
  f.scroll(900);
  expect([f.up.hidden, f.down.hidden]).toEqual([false, true]);
  f.geometry.bottom = 30;
  f.scroll(1000);
  expect(f.isHidden()).toBe(true);
  window.dispatchEvent(new Event('scrollend'));
  f.geometry.bottom = 2400;
  f.scroll(800);
  expect(f.isHidden()).toBe(true);
  window.dispatchEvent(new Event('touchmove'));
  f.scroll(810);
  expect(f.up.hidden).toBe(false);
  f.geometry.height = 0;
  document.dispatchEvent(new CustomEvent('daysforth:history'));
  expect(f.isHidden()).toBe(true);
  stop();
  f.geometry.height = 1000;
  window.dispatchEvent(new Event('wheel'));
  f.scroll(900);
  expect(f.isHidden()).toBe(true);
});

it('hands a first genuine scroll to deferred shortcuts without requiring a second gesture', () => {
  const f = timeline();
  Object.assign(f.geometry, { top: 50, contentTop: 100 });
  stops.push(initTimelineJumps(document, window, { user: true, delta: 300 }));
  expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
});

it('distinguishes scroll keys and scrollbar intent from form/date controls or resize', () => {
  const f = timeline();
  Object.assign(f.geometry, { top: 50, contentTop: 260 });
  stops.push(initTimelineJumps(document, window));
  const input = document.querySelector('input')!;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  f.scroll(10);
  expect(f.isHidden()).toBe(true);
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  f.scroll(20);
  expect(f.isHidden()).toBe(true);
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  window.dispatchEvent(new Event('resize'));
  f.scroll(30);
  expect(f.isHidden()).toBe(true);
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  f.scroll(40);
  expect(f.isHidden()).toBe(true);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(500);
  document.documentElement.dispatchEvent(
    new PointerEvent('pointerdown', { clientX: 520, bubbles: true }),
  );
  f.scroll(50);
  expect(f.down.hidden).toBe(false);
  f.geometry.top = 600;
  f.scroll(0);
  f.geometry.top = 50;
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  f.scroll(60);
  expect(f.down.hidden).toBe(false);
});

it('keeps the upper shortcut at the viewport after an unstuck dock scrolls away, preserving focus', () => {
  const f = timeline();
  const home = f.up.parentElement;
  Object.assign(f.geometry, { top: 50, contentTop: 100 });
  const stop = initTimelineJumps(document, window);
  stops.push(stop);
  window.dispatchEvent(new Event('touchmove'));
  f.scroll(10);
  f.up.focus();
  f.geometry.dock = -20;
  f.scroll(20);
  expect(f.up.parentElement).toBe(f.down.parentElement);
  expect(f.up.hasAttribute('data-dock-detached')).toBe(true);
  expect(document.activeElement).toBe(f.up);
  f.geometry.dock = 200;
  f.scroll(30);
  expect(f.up.parentElement).toBe(home);
  expect(f.up.hasAttribute('data-dock-detached')).toBe(false);
  f.up.blur();
  f.geometry.dock = 0;
  f.scroll(40);
  expect(f.up.parentElement).toBe(f.down.parentElement);
  stop();
  expect(f.up.parentElement).toBe(home);
  expect(f.up.hidden).toBe(true);
});

it('keeps timeline gestures and directions inert while a modal owns scrolling', () => {
  const f = timeline();
  Object.assign(f.geometry, { top: 50, contentTop: 100 });
  stops.push(initTimelineJumps(document, window));
  window.dispatchEvent(new Event('wheel'));
  f.scroll(300);
  expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
  document.body.insertAdjacentHTML('beforeend', '<dialog open></dialog>');
  f.scroll(310);
  expect(f.isHidden()).toBe(true);
  document.querySelector('dialog')!.remove();
  window.dispatchEvent(new Event('scrollend'));
  f.scroll(320);
  expect([f.up.hidden, f.down.hidden]).toEqual([false, false]);
});

function media() {
  document.body.innerHTML =
    '<article class="post-card"><a id="title">Title</a><div class="post-media"><a data-photo><img alt="Portrait"></a><a class="post-media__open">Post</a></div><button>Save</button></article><li class="project"><span>Project copy</span><div class="post-media"></div></li><div class="post-media" id="standalone"><span>Cover</span></div><aside>Outside</aside>';
  stops.push(initMediaAffordances(document, window));
  const photo = document.querySelector<HTMLElement>('[data-photo]')!;
  const tap = (target: Element, pointerType = 'touch') => {
    target.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true }));
    const event = new MouseEvent('click', { detail: 1, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };
  return { photo, tap, card: document.querySelector<HTMLElement>('article')! };
}

it('reveals on the first photo tap and allows the next photo activation through', () => {
  const f = media();
  const first = f.tap(f.photo);
  expect(first.defaultPrevented).toBe(true);
  expect(f.card.dataset['mediaRevealed']).toBe('true');
  expect(f.tap(f.photo).defaultPrevented).toBe(false);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  expect(f.card.dataset['mediaRevealed']).toBe('true');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(f.card.dataset['mediaRevealed']).toBeUndefined();
  expect(f.tap(document.querySelector('#title')!).defaultPrevented).toBe(false);
  expect(f.tap(document.querySelector('button')!).defaultPrevented).toBe(false);
});

it('retains a focused card reveal before touch focus loss can hide its explicit post control', () => {
  const f = media();
  f.photo.tabIndex = 0;
  f.photo.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(document.activeElement).toBe(f.photo);
  expect(f.card.dataset['mediaRevealed']).toBeUndefined();
  const control = document.querySelector<HTMLElement>('.post-media__open')!;
  control.innerHTML = '<span>Open post</span>';
  const icon = control.querySelector('span')!;
  icon.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
  expect(f.card.dataset['mediaRevealed']).toBe('true');
  f.photo.blur();
  expect(document.activeElement).not.toBe(f.photo);
  const click = new MouseEvent('click', { detail: 1, bubbles: true, cancelable: true });
  icon.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(false);
  expect(f.card.dataset['mediaRevealed']).toBe('true');

  window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch' }));
  const orphan = document.createElement('a');
  orphan.className = 'post-media__open';
  document.body.append(orphan);
  f.tap(orphan);
  expect(document.querySelector('[data-media-revealed]')).toBeNull();
});

it('keeps one card revealed and preserves mouse, keyboard, project and standalone media semantics', () => {
  const f = media();
  f.photo.click();
  f.tap(f.photo);
  f.tap(document.querySelector('.project span')!, 'pen');
  expect(f.card.dataset['mediaRevealed']).toBeUndefined();
  expect(document.querySelector<HTMLElement>('.project')!.dataset['mediaRevealed']).toBe('true');
  f.tap(document.querySelector('#standalone span')!);
  expect(document.querySelector<HTMLElement>('#standalone')!.dataset['mediaRevealed']).toBe('true');
  f.tap(document.querySelector('aside')!);
  expect(document.querySelector('[data-media-revealed]')).toBeNull();
  f.tap(f.photo);
  const keyboard = new MouseEvent('click', { detail: 0, bubbles: true, cancelable: true });
  f.photo.dispatchEvent(keyboard);
  expect(keyboard.defaultPrevented).toBe(false);
  window.dispatchEvent(new MouseEvent('click', { detail: 1 }));
  f.tap(f.photo, 'mouse');
  expect(document.querySelector('[data-media-revealed]')).toBeNull();
});
