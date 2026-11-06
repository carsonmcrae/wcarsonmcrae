/**
 * Purpose: Small helpers for writing lists and dates the way a person would.
 * Scope: The separator before each item of an English list ("A and B", "A, B, and C"), joining
 *   plain strings into such a list, long-form timestamps in Nashville, and timezone-stable calendar dates.
 * Does NOT belong: Markdown rendering (src/lib/inline-markdown.ts) or the content (src/data).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */

/** The text that goes before item `index` in an English list of `count` items. */
export function listSeparator(index: number, count: number): string {
  if (index === 0) {
    return '';
  }
  if (count === 2) {
    return ' and ';
  }
  return index === count - 1 ? ', and ' : ', ';
}

export function joinList(items: readonly string[]): string {
  return items.map((item, index) => `${listSeparator(index, items.length)}${item}`).join('');
}

export function formatDate(date: Date, timeZone = 'America/Chicago'): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);
}

/** Date-only content retains its calendar day, independently of the visitor’s time zone. */
export function formatDateOnly(date: string): string {
  return formatDate(new Date(`${date}T12:00:00Z`), 'UTC');
}
