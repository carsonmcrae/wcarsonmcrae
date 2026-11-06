/**
 * Purpose: Preserve native disclosure text targets while deferred timeline state initializes or changes.
 * Scope: Existing Text node identity, unchanged labels, updated dates/categories, and markup contracts.
 * Does NOT belong: Synthetic browser activation or visual layout assertions.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it } from 'vitest';
import { initTimeline } from '../../src/lib/timeline-controller';
import { disposeDocument } from './helpers';
import { timelineLoadingFixture } from './timeline-loading-fixture';

const stops: (() => void)[] = [];
afterEach(() => disposeDocument(stops));

it('keeps each summary Text node through initial hydration and later changed labels', () => {
  const f = timelineLoadingFixture();
  const category = document.querySelector('[data-category-label]')!;
  const date = document.querySelector('[data-current-date]')!;
  const categoryText = category.firstChild!;
  const dateText = date.firstChild!;
  const controller = initTimeline(document, f.win, { preservePosition: true })!;
  stops.push(controller.destroy);
  expect(category.firstChild).toBe(categoryText);
  expect(date.firstChild).toBe(dateText);
  expect(categoryText.textContent).toBe('All categories');
  expect(dateText.textContent).toBe('November 2026');
  const work = document.querySelector<HTMLInputElement>('[name="category"][value="Work"]')!;
  work.checked = true;
  controller.activate(work, 'change');
  controller.goToDate('2022-05');
  expect(category.firstChild).toBe(categoryText);
  expect(date.firstChild).toBe(dateText);
  expect(categoryText.isConnected && dateText.isConnected).toBe(true);
  expect(categoryText.textContent).toBe('Work');
  expect(dateText.textContent).toBe('May 2022');
});

it.each(['[data-category-label]', '[data-current-date]'])(
  'rejects an invalid summary text contract at %s',
  (selector) => {
    const f = timelineLoadingFixture();
    document.querySelector(selector)!.replaceChildren(document.createElement('em'));
    expect(() => initTimeline(document, f.win, { preservePosition: true })).toThrow(
      'Timeline summary requires a Text node.',
    );
  },
);

it('keeps markup-like category values literal without replacing the pressed Text node', () => {
  const f = timelineLoadingFixture();
  const category = document.querySelector('[data-category-label]')!;
  const original = category.firstChild;
  const controller = initTimeline(document, f.win, { preservePosition: true })!;
  stops.push(controller.destroy);
  const work = document.querySelector<HTMLInputElement>('[name="category"][value="Work"]')!;
  const value = '<strong data-probe>literal category</strong>';
  work.value = value;
  work.checked = true;
  controller.activate(work, 'change');
  expect(category.firstChild).toBe(original);
  expect(category.textContent).toBe(value);
  expect(document.querySelector('[data-probe]')).toBeNull();
});
