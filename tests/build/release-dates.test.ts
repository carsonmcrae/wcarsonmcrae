/**
 * Purpose: Preserve published release dates in both rendered release destinations.
 * Scope: Semantic date-only time elements and matching calendar labels on the index and detail pages.
 * Does NOT belong: Choosing historical dates, browser locale preferences, or publication automation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { releases } from '../../src/data/releases';
import { formatDateOnly } from '../../src/lib/text';
import { parse } from './dist';

describe.each(releases)('permanent date for release $version', (release) => {
  it('renders the recorded calendar day on the index and its permanent page', () => {
    const index = parse('releases/index.html');
    const card = [...index.querySelectorAll('.release-card')].find((article) =>
      article.querySelector('h2')?.textContent?.includes(release.title),
    )!;
    const detail = parse(`releases/${release.version}/index.html`);
    const times = [card.querySelector('time'), detail.querySelector('.release-intro time')];
    for (const time of times) {
      expect(time?.getAttribute('datetime')).toBe(release.date);
      expect(time?.textContent?.trim()).toBe(formatDateOnly(release.date));
    }
  });
});
