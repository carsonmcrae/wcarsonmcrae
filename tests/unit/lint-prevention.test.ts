/**
 * Purpose: Prove the actual ESLint configuration prevents recurring scan findings.
 * Scope: Function/block limits, condition readability, nested ternaries, and regex construction.
 * Does NOT belong: Reimplementing ESLint metrics or replacing full-scope Sonar analysis.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const lint = new ESLint();
async function rules(source: string): Promise<(string | null)[]> {
  const [result] = await lint.lintText(source, { filePath: 'src/lib/prevention-example.ts' });
  expect(result!.messages.filter((message) => message.fatal)).toEqual([]);
  return result!.messages.map((message) => message.ruleId);
}
function branches(count: number): string {
  const decisions = Array.from(
    { length: count },
    (_, index) => `if (flags[${index}]) return ${index};`,
  ).join('\n');
  return `export function choose(flags) { ${decisions} return -1; }`;
}
function nesting(depth: number): string {
  const blocks = Array.from({ length: depth }, (_, index) => `if (flags[${index}]) {`).join('\n');
  return `export function choose(flags) { ${blocks} return 1; ${'}'.repeat(depth)} return 0; }`;
}

describe('scan prevention through the real ESLint configuration', () => {
  it('allows complexity 20 and rejects 21 without measuring nested functions as their parent', async () => {
    expect(await rules(branches(19))).not.toContain('complexity');
    expect(await rules(branches(20))).toContain('complexity');
    expect(
      await rules(
        `export function outer() { ${branches(19).replace('export ', '')} return choose; }`,
      ),
    ).not.toContain('complexity');
  });
  it('allows four nested blocks and rejects a fifth', async () => {
    expect(await rules(nesting(4))).not.toContain('max-depth');
    expect(await rules(nesting(5))).toContain('max-depth');
  });
  it('rejects negated alternatives while allowing an early guard clause', async () => {
    expect(
      await rules('export function choose(ok) { if (!ok) return 0; else return 1; }'),
    ).toContain('no-negated-condition');
    expect(
      await rules('export function choose(ok) { if (!ok) return 0; return 1; }'),
    ).not.toContain('no-negated-condition');
    expect(await rules('export function choose(ok) { return !ok ? 0 : 1; }')).toContain(
      'no-negated-condition',
    );
  });
  it('retains the existing nested-ternary guard', async () => {
    expect(await rules('export function choose(a, b) { return a ? 1 : b ? 2 : 3; }')).toContain(
      'no-nested-ternary',
    );
    expect(await rules('export function choose(a) { return a ? 1 : 2; }')).not.toContain(
      'no-nested-ternary',
    );
  });
  it('prefers literal regexes and rejects doubled-escape dynamic templates', async () => {
    expect(await rules('export const pattern = new RegExp("abc");')).toContain(
      'prefer-regex-literals',
    );
    expect(await rules('export const pattern = /abc/;')).not.toContain('prefer-regex-literals');
    const dynamic = 'export function pattern(prefix) { return new RegExp(`^${prefix}\\\\d$`); }';
    const raw =
      'export function pattern(prefix) { return new RegExp(String.raw`^${prefix}\\d$`); }';
    expect(await rules(dynamic)).toContain('no-restricted-syntax');
    expect(await rules(dynamic.replace('new RegExp', 'RegExp'))).toContain('no-restricted-syntax');
    expect(await rules(raw)).not.toContain('no-restricted-syntax');
    expect(
      await rules('export function pattern(prefix) { return new RegExp(`^${prefix}$`); }'),
    ).not.toContain('no-restricted-syntax');
  });
  it('keeps catastrophic backtracking and empty sort comparators prohibited', async () => {
    expect(await rules('export const pattern = /^(a+)+$/;')).toContain(
      'regexp/no-super-linear-backtracking',
    );
    expect(await rules('export function ordered(values) { return values.toSorted(); }')).toContain(
      'no-restricted-syntax',
    );
  });
});
