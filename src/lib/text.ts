/**
 * Purpose: Small helpers for writing lists and dates the way a person would.
 * Scope: The separator before each item of an English list ("A and B", "A, B, and C"), joining
 *   plain strings into such a list, and long-form dates in Nashville's time zone.
 * Does NOT belong: Markdown rendering (src/lib/inline-markdown.ts) or the content (src/data).
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
