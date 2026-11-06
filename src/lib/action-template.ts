/**
 * Purpose: Expand the single optional-control template into individually labelled post actions.
 * Scope: Safe DOM cloning and labels from existing headings; stories stay complete without JavaScript.
 * Does NOT belong: Event listeners, persistence, or reaction requests.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function fillActionRows(doc: Document) {
  const template = doc.querySelector<HTMLTemplateElement>('#post-action-template');
  if (!template) return;
  for (const row of doc.querySelectorAll<HTMLElement>('[data-post-actions]')) {
    row.replaceChildren(template.content.cloneNode(true));
    const title =
      row.dataset['postTitle'] ??
      row.closest('.post-card,.post-detail')!.querySelector('h1,h3')!.textContent!.trim();
    row.dataset['postTitle'] = title;
    row.querySelector('[role="group"]')!.setAttribute('aria-label', `Reactions to ${title}`);
    for (const button of row.querySelectorAll<HTMLButtonElement>('[data-react]'))
      button.setAttribute(
        'aria-label',
        `${button.dataset['reactionLabel']} ${title}. Reaction count unavailable.`,
      );
    row.querySelector('[data-save]')!.setAttribute('aria-label', `Save ${title}`);
    row.querySelector('[data-copy]')!.setAttribute('aria-label', `Copy link to ${title}`);
  }
}
