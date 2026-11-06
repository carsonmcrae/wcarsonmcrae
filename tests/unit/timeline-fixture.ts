/**
 * Purpose: Minimal DOM contracts for timeline behavior tests.
 * Scope: Production data attributes, native controls, isolated history, and controllable scroll observers.
 * Does NOT belong: Grouping/filtering logic or layout assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { vi } from 'vitest';
import { timelinePosts } from '../../src/data/timeline';
import { categoryPresentation } from '../../src/data/categories';
import { monthIndex, MONTHS } from '../../src/lib/timeline-dates';
import { initTimeline } from '../../src/lib/timeline-controller';
export function timelineFixture(search = '', observe = false, scrollY?: number) {
  document.body.innerHTML = `<div><button data-jump-date="1999-11">Born</button><input data-date-slider type="range" min="${monthIndex('1999-11')}" max="${monthIndex('2026-11')}" value="${monthIndex('2026-11')}"><output data-date-preview hidden></output></div>
  <section data-timeline><div><button data-view="timeline">Timeline</button><button data-view="posts"><span>Posts</span></button></div>
  <details data-timeline-menu><summary><svg data-category-icon><use href="/icons.svg#icon-filter"></use></svg><span data-category-label>All categories</span></summary><fieldset>${['All', 'Work', 'Projects', 'Life', 'Milestones', 'Saved'].map((value) => `<label><input type="radio" name="category" value="${value}"><svg><use href="/icons.svg#icon-${categoryPresentation[value as keyof typeof categoryPresentation].icon}"></use></svg></label>`).join('')}</fieldset></details>
  <details data-timeline-menu><summary><span data-current-date>November 2026</span></summary><form data-date-form><select name="month">${MONTHS.map((month, index) => `<option value="${String(index + 1).padStart(2, '0')}">${month}</option>`).join('')}</select><select name="year">${Array.from({ length: 28 }, (_, index) => `<option>${1999 + index}</option>`).join('')}</select><button>Go to date</button></form>${['years', 'quarters', 'months'].map((value) => `<input type="radio" name="detail" value="${value}">`).join('')}</details>
  <div data-timeline-empty hidden tabindex="-1"></div><div data-timeline-groups>${timelinePosts.map((post) => `<article class="post-card" data-category="${post.category}" data-milestone="${Boolean(post.milestone)}" id="moment-${post.id}"><time datetime="${post.date}"></time><h3><a href="/posts/${post.id}/">${post.title}</a></h3></article>`).join('')}</div><p data-timeline-status></p></section>`;
  let location = new URL(`https://daysforth.com/${search}`);
  const navigate = (_data: unknown, _unused: string, url: string | URL | null | undefined) => {
    location = new URL(String(url));
  };
  const history = {
    state: scrollY === undefined ? null : { scrollY },
    scrollRestoration: 'auto',
    replaceState: vi.fn(navigate),
    pushState: vi.fn(navigate),
  };
  const events = new EventTarget();
  const observers: {
    callback: IntersectionObserverCallback;
    disconnect: ReturnType<typeof vi.fn>;
  }[] = [];
  class Observer {
    disconnect = vi.fn();
    observe = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      observers.push({ callback, disconnect: this.disconnect });
    }
  }
  const win = {
    get location() {
      return location;
    },
    history,
    scrollTo: vi.fn(),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    ...(observe ? { IntersectionObserver: Observer } : {}),
  } as unknown as Parameters<typeof initTimeline>[1];
  const scrolling = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  const controller = initTimeline(document, win)!;
  const change = (name: string, value: string) => {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="${name}"][value="${value}"]`,
    )!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  return {
    controller,
    history,
    change,
    scrolling,
    observers,
    win,
    events,
    setUrl: (search: string) => {
      location = new URL(`https://daysforth.com/${search}`);
    },
  };
}
