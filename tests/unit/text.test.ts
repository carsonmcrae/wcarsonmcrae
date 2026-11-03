/**
 * Purpose: Unit tests for src/lib/text.ts.
 * Scope: English list separators and joining for one, two, and many items, and dates in
 *   Nashville's time zone.
 * Does NOT belong: Markdown rendering (tests/unit/inline-markdown.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { formatDate, joinList, listSeparator } from '../../src/lib/text';

describe('lists', () => {
  it('joins items the way a person would write them', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['React'])).toBe('React');
    expect(joinList(['React', 'TypeScript'])).toBe('React and TypeScript');
    expect(joinList(['React', 'TypeScript', 'Python'])).toBe('React, TypeScript, and Python');
  });

  it('gives the separator before each item', () => {
    expect([0, 1, 2, 3].map((index) => listSeparator(index, 4))).toEqual([
      '',
      ', ',
      ', ',
      ', and ',
    ]);
  });
});

describe('formatDate', () => {
  it('writes dates in full, in Nashville time by default', () => {
    // 3:00 UTC on November 4 is still November 3 in Nashville.
    expect(formatDate(new Date('2026-11-04T03:00:00Z'))).toBe('November 3, 2026');
    expect(formatDate(new Date('2026-11-04T03:00:00Z'), 'UTC')).toBe('November 4, 2026');
  });
});
