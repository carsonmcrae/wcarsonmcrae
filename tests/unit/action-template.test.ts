/**
 * Purpose: Keep social-action names tied to the story's already-rendered heading.
 * Scope: Card/detail heading discovery and safe accessible-name hydration without repeated HTML data.
 * Does NOT belong: Reaction requests, persistence, or click delivery.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { fillActionRows } from '../../src/lib/action-template';

describe.each([
  { container: 'post-card', heading: 'h3' },
  { container: 'post-detail', heading: 'h1' },
])('heading-backed action names in $container', ({ container, heading }) => {
  it('uses the visible title, including inline emphasis and decoded characters', () => {
    document.body.innerHTML = `<template id="post-action-template">
      <div role="group"><button data-react="heart" data-reaction-label="React to"></button></div>
      <button data-save></button><button data-copy></button></template>
      <article class="${container}"><${heading}>One &amp; <em>two</em></${heading}>
      <div data-post-actions="one"></div></article>`;
    fillActionRows(document);
    const row = document.querySelector<HTMLElement>('[data-post-actions]')!;
    expect(row.dataset['postTitle']).toBe('One & two');
    const labels = {
      '[role="group"]': 'Reactions to One & two',
      '[data-react]': 'React to One & two. Reaction count unavailable.',
      '[data-save]': 'Save One & two',
      '[data-copy]': 'Copy link to One & two',
    };
    for (const [selector, label] of Object.entries(labels))
      expect(row.querySelector(selector)!.getAttribute('aria-label')).toBe(label);
  });
});
