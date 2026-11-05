/**
 * Purpose: Verify desktop rail previews reuse rendered cards and the existing jump contract.
 * Scope: Active ticks, exact same-month destinations, keyboard/pointer input, visibility and cleanup.
 * Does NOT belong: Timeline history ownership or browser screenshots.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initMomentNavigator } from '../../src/lib/moment-navigator';
import { disposeDocument, fakeMediaQuery } from './helpers';
const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));

function fixture() {
  document.body.innerHTML =
    '<header class="site-header"></header><section data-timeline data-view="timeline"><div class="timeline-dock"></div><div data-timeline-groups><article data-moment="one" data-date="2026-10"><h3><a>First October moment</a></h3></article><article data-moment="two" data-date="2026-10"><h3><a>Second October moment</a></h3></article><article data-moment="three" data-date="2022-05"><h3><a>Older moment</a></h3></article></div></section><nav data-moment-navigator hidden><button data-moment-rail aria-expanded="false"><span data-moment-ticks></span></button><div data-moment-previews hidden><ol data-moment-links></ol></div></nav><button id="outside">Outside</button>';
  const root = document.querySelector<HTMLElement>('[data-timeline]')!;
  const groups = document.querySelector<HTMLElement>('[data-timeline-groups]')!;
  const widget = document.querySelector<HTMLElement>('[data-moment-navigator]')!;
  const rail = document.querySelector<HTMLButtonElement>('[data-moment-rail]')!;
  const panel = document.querySelector<HTMLElement>('[data-moment-previews]')!;
  const geometry = {
    top: 50,
    bottom: 2000,
    cardBottoms: [500, 760, 1000],
    cardTops: [260, 520, 780],
  };
  const rect = (element: Element, get: () => object) =>
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => get() as DOMRect);
  rect(document.querySelector('header')!, () => ({ bottom: 56 }));
  rect(document.querySelector('.timeline-dock')!, () => ({ bottom: 250 }));
  rect(root, () => ({ top: geometry.top, bottom: geometry.bottom }));
  rect(groups, () => ({ top: 260, bottom: 1900, height: 1640 }));
  rect(rail, () => ({ top: 100, height: 300 }));
  Array.from(groups.children).forEach((card, index) =>
    rect(card, () => ({ top: geometry.cardTops[index], bottom: geometry.cardBottoms[index] })),
  );
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  const desktop = fakeMediaQuery(true);
  vi.spyOn(window, 'matchMedia').mockReturnValue(desktop as unknown as MediaQueryList);
  const stop = initMomentNavigator(document, window);
  stops.push(stop);
  const links = () => Array.from(widget.querySelectorAll<HTMLAnchorElement>('a'));
  const press = (key: string) =>
    widget.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  return { root, groups, widget, rail, panel, desktop, geometry, stop, links, press };
}

it('initializes harmlessly without the timeline or its optional rail', () => {
  const listen = vi.spyOn(window, 'addEventListener');
  const media = vi.spyOn(window, 'matchMedia');
  stops.push(initMomentNavigator(document, window));
  document.body.innerHTML = '<section data-timeline></section>';
  stops.push(initMomentNavigator(document, window));
  expect(listen).not.toHaveBeenCalled();
  expect(media).not.toHaveBeenCalled();
  expect(document.querySelector('[data-moment-navigator]')).toBeNull();
});

it('keeps each rendered same-month moment distinct and follows the visible card', () => {
  const f = fixture();
  expect(f.widget.hidden).toBe(false);
  expect(f.links()).toHaveLength(3);
  expect(f.links().map((link) => link.dataset['jumpMoment'])).toEqual(['one', 'two', 'three']);
  expect(f.links()[0]!.textContent).toContain('October 2026');
  expect(f.links()[1]!.textContent).toContain('Second October moment');
  expect(f.links()[0]!.getAttribute('aria-current')).toBe('true');
  f.geometry.cardBottoms[0] = 200;
  window.dispatchEvent(new Event('scroll'));
  expect(f.links()[1]!.getAttribute('aria-current')).toBe('true');
  expect(f.widget.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  f.geometry.cardTops = [900, 920, 940];
  document.dispatchEvent(new Event('toggle'));
  expect(f.widget.querySelectorAll('[aria-current="true"]')).toHaveLength(0);
  f.geometry.cardBottoms = [0, 0, 0];
  window.dispatchEvent(new Event('resize'));
  f.rail.click();
  expect(document.activeElement).toBe(f.links()[0]);
});

it('supports keyboard previews, Escape, direct rail selection and outside/leave dismissal', () => {
  const f = fixture();
  f.rail.focus();
  expect(f.panel.hidden).toBe(false);
  f.press('ArrowDown');
  expect(document.activeElement).toBe(f.links()[1]);
  f.rail.focus();
  f.rail.click();
  expect(document.activeElement).toBe(f.links()[0]);
  f.press('ArrowDown');
  expect(document.activeElement).toBe(f.links()[1]);
  f.press('End');
  expect(document.activeElement).toBe(f.links()[2]);
  f.press('ArrowDown');
  expect(document.activeElement).toBe(f.links()[2]);
  f.press('Home');
  f.press('ArrowUp');
  expect(document.activeElement).toBe(f.links()[0]);
  f.press('x');
  f.press('Escape');
  expect(document.activeElement).toBe(f.rail);
  expect(f.panel.hidden).toBe(true);
  f.widget.dispatchEvent(new PointerEvent('pointerenter'));
  f.widget.dispatchEvent(new PointerEvent('pointerleave'));
  expect(f.panel.hidden).toBe(false);
  document.querySelector<HTMLButtonElement>('#outside')!.focus();
  f.widget.dispatchEvent(new PointerEvent('pointerleave'));
  expect(f.panel.hidden).toBe(true);
  f.widget.dispatchEvent(new PointerEvent('pointerenter'));
  f.widget.dispatchEvent(new FocusEvent('focusout', { relatedTarget: f.links()[0]! }));
  expect(f.panel.hidden).toBe(false);
  f.widget.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
  expect(f.panel.hidden).toBe(true);
  f.widget.dispatchEvent(new PointerEvent('pointerenter'));
  f.widget.dispatchEvent(new FocusEvent('focusout'));
  expect(f.panel.hidden).toBe(true);
  const selected: string[] = [];
  f.links().forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      selected.push(link.dataset['jumpMoment']!);
    }),
  );
  f.rail.dispatchEvent(new MouseEvent('click', { detail: 1, clientY: 250, bubbles: true }));
  f.rail.dispatchEvent(new MouseEvent('click', { detail: 1, clientY: 600, bubbles: true }));
  f.rail.dispatchEvent(new MouseEvent('click', { detail: 1, clientY: 0, bubbles: true }));
  expect(selected).toEqual(['two', 'three', 'one']);
  f.widget.dispatchEvent(new PointerEvent('pointerenter'));
  f.widget.querySelector('ol')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  document.dispatchEvent(new MouseEvent('click'));
  expect(f.panel.hidden).toBe(true);
  const nonNode = new MouseEvent('click');
  Object.defineProperty(nonNode, 'target', { value: null });
  document.dispatchEvent(nonNode);
  const nonElement = new MouseEvent('click', { bubbles: true });
  Object.defineProperty(nonElement, 'target', { value: document.createTextNode('Text') });
  f.widget.querySelector('ol')!.dispatchEvent(nonElement);
});

it('rebuilds after filters and removes every observer/listener when disposed', async () => {
  const f = fixture();
  f.desktop.change(false);
  expect(f.widget.hidden).toBe(true);
  f.widget.dispatchEvent(new PointerEvent('pointerenter'));
  f.rail.click();
  f.rail.dispatchEvent(new PointerEvent('pointermove'));
  f.press('ArrowDown');
  expect(f.panel.hidden).toBe(true);
  f.desktop.change(true);
  f.root.dataset['view'] = 'posts';
  await vi.waitFor(() => expect(f.widget.hidden).toBe(true));
  f.root.dataset['view'] = 'timeline';
  await vi.waitFor(() => expect(f.widget.hidden).toBe(false));
  f.geometry.top = 800;
  document.dispatchEvent(new CustomEvent('daysforth:history'));
  expect(f.widget.hidden).toBe(true);
  f.geometry.top = 50;
  f.groups.replaceChildren();
  await vi.waitFor(() => expect(f.links()).toHaveLength(0));
  expect(f.widget.hidden).toBe(true);
  f.widget.hidden = false;
  f.rail.click();
  f.rail.dispatchEvent(new PointerEvent('pointermove'));
  f.press('ArrowDown');
  f.stop();
  f.groups.innerHTML = '<article data-moment="new" data-date="2026-11"><h3>New</h3></article>';
  f.desktop.change(true);
  window.dispatchEvent(new Event('scroll'));
  expect(f.widget.hidden).toBe(true);
  expect(f.links()).toHaveLength(0);
});

it('keeps preview nodes and focus when reaction text or card actions hydrate', async () => {
  const f = fixture();
  f.rail.click();
  const original = f.links()[0]!;
  const card = f.groups.firstElementChild!;
  const count = document.createElement('span');
  count.textContent = '3';
  card.append(count);
  count.textContent = '4';
  card.append(document.createElement('button'));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(f.links()[0]).toBe(original);
  expect(document.activeElement).toBe(original);
});

it('previews top/middle/bottom ticks without changing the current item or scrolling the document', () => {
  const f = fixture();
  vi.spyOn(f.panel, 'clientHeight', 'get').mockReturnValue(70);
  f.links().forEach((link, index) => {
    vi.spyOn(link, 'offsetTop', 'get').mockReturnValue(index * 60);
    vi.spyOn(link, 'offsetHeight', 'get').mockReturnValue(60);
  });
  const move = (clientY: number) =>
    f.rail.dispatchEvent(new PointerEvent('pointermove', { clientY }));
  move(399);
  expect(f.links()[2]!.dataset['preview']).toBe('true');
  expect(f.links()[0]!.getAttribute('aria-current')).toBe('true');
  expect(f.panel.scrollTop).toBe(110);
  move(250);
  expect(f.links()[1]!.dataset['preview']).toBe('true');
  expect(f.panel.scrollTop).toBe(60);
  move(100);
  expect(f.links()[0]!.dataset['preview']).toBe('true');
  expect(f.panel.scrollTop).toBe(0);
  f.rail.dispatchEvent(new PointerEvent('pointerleave'));
  expect(f.widget.querySelector('[data-preview]')).toBeNull();
  move(250);
  document.dispatchEvent(new MouseEvent('click'));
  expect(f.widget.querySelector('[data-preview]')).toBeNull();
});
