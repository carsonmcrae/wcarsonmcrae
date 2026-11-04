/**
 * Purpose: Regression checks for keyboard-safe menus and readable action feedback.
 * Scope: Escape/focus, mutual exclusion, outside dismissal, notice timing, hover/focus pause, and cleanup.
 * Does NOT belong: Timeline filters or network actions.
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initDisclosures } from '../../src/lib/disclosures';
import { initActionNotice } from '../../src/lib/notices';
afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('native disclosure menus', () => {
  it('keeps one menu open, ignores unrelated toggles, and dismisses with Escape or outside clicks', () => {
    document.body.innerHTML =
      '<details data-timeline-menu><summary>Categories</summary><button>Life</button></details><details data-timeline-menu><summary>Date</summary></details><details id="cluster"><summary>Cluster</summary></details><button id="outside">Outside</button>';
    const destroy = initDisclosures(document);
    const [category, date] = [
      ...document.querySelectorAll<HTMLDetailsElement>('[data-timeline-menu]'),
    ];
    category!.open = true;
    category!.dispatchEvent(new Event('toggle', { bubbles: true }));
    expect(category!.open).toBe(true);
    category!.querySelector('button')!.click();
    expect(category!.open).toBe(true);
    date!.open = true;
    date!.dispatchEvent(new Event('toggle', { bubbles: true }));
    expect(category!.open).toBe(false);
    document.dispatchEvent(new Event('toggle'));
    const cluster = document.querySelector<HTMLDetailsElement>('#cluster')!;
    cluster.open = true;
    cluster.dispatchEvent(new Event('toggle', { bubbles: true }));
    expect(date!.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(date!.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(date!.open).toBe(false);
    expect(document.activeElement).toBe(date!.querySelector('summary'));
    date!.dispatchEvent(new Event('toggle', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    category!.open = true;
    document.querySelector<HTMLButtonElement>('#outside')!.click();
    expect(category!.open).toBe(false);
    destroy();
    category!.open = true;
    document.querySelector<HTMLButtonElement>('#outside')!.click();
    expect(category!.open).toBe(true);
  });
});
describe('action notices', () => {
  it('is optional when the current page has no action notice', () => {
    const notice = initActionNotice(document, window);
    expect(() => notice.show('Saved')).not.toThrow();
    notice.destroy();
  });
  it('announces, pauses while hovered or focused, times out after eight seconds, and dismisses by hand', () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<p data-action-live role="status" aria-atomic="true"></p><div data-action-notice hidden><span data-notice-text></span><button data-dismiss-notice>Dismiss</button></div>';
    const clock = {
      setTimeout: (callback: TimerHandler, ms: number) =>
        Number(setTimeout(callback as () => void, ms)),
      clearTimeout: (id: number) => clearTimeout(id),
    };
    const notice = initActionNotice(document, clock as Pick<Window, 'setTimeout' | 'clearTimeout'>);
    const element = document.querySelector<HTMLElement>('[data-action-notice]')!;
    const live = document.querySelector<HTMLElement>('[data-action-live]')!;
    expect(live.hidden).toBe(false);
    notice.show('Saved in this browser.');
    expect(element.textContent).toContain('Saved in this browser.');
    expect(live.textContent).toBe('Saved in this browser.');
    vi.advanceTimersByTime(7999);
    expect(element.hidden).toBe(false);
    element.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(10_000);
    expect(element.hidden).toBe(false);
    element.dispatchEvent(new Event('mouseleave'));
    element.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(10_000);
    expect(element.hidden).toBe(false);
    element.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(8000);
    expect(element.hidden).toBe(true);
    expect(live.textContent).toBe('');
    notice.show('Link copied.');
    element.querySelector('button')!.click();
    expect(element.hidden).toBe(true);
    notice.destroy();
    element.dispatchEvent(new Event('mouseleave'));
    expect(vi.getTimerCount()).toBe(0);
  });
});
