/**
 * Purpose: Cover selection, shared glyph, and event-slider guarantees.
 * Scope: Photo/icon fallback, album counts, accessible previews, route commits, and listener cleanup.
 * Does NOT belong: Visual screenshot comparisons or browser storage.
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { postMedia } from '../../src/lib/post-media';
import { initPostNavigation } from '../../src/lib/post-navigation';
import { icons, iconBody } from '../../src/lib/icons';
const base = {
  id: 'example',
  date: '2026-11',
  title: 'An example',
  caption: '',
  body: [],
  category: 'Life' as const,
};
afterEach(() => {
  document.body.innerHTML = '';
});
describe('post covers', () => {
  it('keeps photos and screens distinct and counts only distinct album additions', () => {
    expect(
      postMedia({
        ...base,
        image: 'photo',
        imageAlt: 'A real photo',
        gallery: [{ name: 'another', alt: 'Another photo', caption: 'Another view' }],
      }),
    ).toEqual({ name: 'photo', alt: 'A real photo', kind: 'photo', count: 2 });
    expect(postMedia({ ...base, image: 'interface', imageKind: 'screen' }).kind).toBe('screen');
    expect(postMedia({ ...base, project: 'daysforth' })).toEqual({
      name: 'daysforth',
      kind: 'project',
      alt: 'An example app icon',
      count: 1,
    });
    expect(postMedia(base).name).toBe('');
  });
});
describe('trusted icon definitions', () => {
  it('contains only library glyphs and strips the outer SVG wrapper for reusable symbols', () => {
    for (const svg of Object.values(icons)) {
      expect(svg).toContain('viewBox="0 0 256 256"');
      expect(iconBody(svg)).not.toMatch(/<\/?svg|<script|foreignObject/);
      expect(iconBody(svg)).toContain('<path');
    }
    expect(iconBody('<path d="M0 0"/>')).toBe('<path d="M0 0"/>');
  });
});
describe('permalink slider', () => {
  it('snaps across gaps, keeps the current same-month event, and traverses every event with arrow keys', () => {
    const navigate = vi.fn();
    document.body.innerHTML =
      '<nav data-post-browser="middle"><input type="range" disabled min="0" max="20" value="10"><output></output><datalist><option value="0" label="Old" data-id="old" data-href="/old/"></option><option value="10" label="Middle" data-id="middle" data-href="/middle/"></option><option value="10" label="Same month" data-id="same" data-href="/same/"></option><option value="20" label="New" data-id="new" data-href="/new/"></option></datalist></nav>';
    const destroy = initPostNavigation(document, navigate)!;
    const input = document.querySelector('input')!;
    expect(input.disabled).toBe(false);
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('output')!.textContent).toBe('Middle');
    input.value = '18';
    input.dispatchEvent(new Event('change'));
    expect(input.value).toBe('20');
    expect(navigate).toHaveBeenLastCalledWith('/new/');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith('/old/');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith('/same/');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(navigate).toHaveBeenCalledTimes(3);
    destroy();
    document.querySelector('nav')!.dataset['postBrowser'] = 'old';
    const finish = initPostNavigation(document, navigate)!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(navigate).toHaveBeenCalledTimes(3);
    finish();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(navigate).toHaveBeenCalledTimes(3);
  });
  it('does nothing off a post and previews before committing a different route', () => {
    const navigate = vi.fn();
    expect(initPostNavigation(document, navigate)).toBeNull();
    document.body.innerHTML =
      '<nav data-post-browser="old"><input type="range" min="0" max="1" value="0"><output>Old</output><datalist><option value="0" label="Old · May 2022" data-id="old" data-href="/posts/old/"></option><option value="1" label="New · October 2026" data-id="new" data-href="/posts/new/"></option></datalist></nav>';
    const destroy = initPostNavigation(document, navigate)!;
    const input = document.querySelector('input')!;
    input.dispatchEvent(new Event('change'));
    expect(navigate).not.toHaveBeenCalled();
    input.value = '1';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('output')!.textContent).toBe('New · October 2026');
    expect(navigate).not.toHaveBeenCalled();
    input.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenCalledWith('/posts/new/');
    destroy();
    input.value = '0';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
