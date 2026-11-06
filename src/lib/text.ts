/**
 * Purpose: Small helpers for readable lists, dates, and bounded text excerpts.
 * Scope: The separator before each item of an English list ("A and B", "A, B, and C"), joining
 *   plain lists, Nashville timestamps, timezone-stable dates, and word-aware metadata excerpts.
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

/** Keep a full excerpt within a character limit without cutting a word when possible. */
export function excerpt(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit - 1);
  const boundary = shortened.lastIndexOf(' ');
  return `${boundary > 0 ? shortened.slice(0, boundary) : shortened}…`;
}
