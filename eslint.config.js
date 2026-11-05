/**
 * Purpose: The flat ESLint configuration for the whole repository.
 * Scope: Recommended JavaScript and TypeScript rules, Astro and strict jsx-a11y rules for
 *   components, the 500-line cap, consistent type imports, no explicit any, and the reliability
 *   guards used across Carson's repositories: no nested ternaries, explicit sort comparators,
 *   replaceAll for literal replacements, Number.* parsing, and regexes that cannot backtrack
 *   super-linearly, bounded function/block complexity, and readable regex construction.
 *   Runs with --max-warnings 0.
 * Does NOT belong: Formatting (Prettier), type checking (astro check), or gates ESLint cannot
 *   express, such as headers and line limits for CSS, YAML, and Markdown (scripts/check-repo.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import regexp from 'eslint-plugin-regexp';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist/',
    'dist-*/',
    '.astro/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    'screenshots/',
    'node_modules/',
    '**/.wrangler/',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-strict'],
  regexp.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'no-nested-ternary': 'error',
      complexity: ['error', { max: 20, variant: 'modified' }],
      'max-depth': ['error', 4],
      'no-negated-condition': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      // WebKit and VoiceOver drop list semantics from lists styled with list-style: none, so an
      // explicit role="list" on those lists is required, not redundant.
      'astro/jsx-a11y/no-redundant-roles': [
        'error',
        { nav: ['navigation'], ul: ['list'], ol: ['list'] },
      ],
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-super-linear-move': 'error',
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use crypto.getRandomValues().' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: String.raw`:matches(NewExpression, CallExpression)[callee.type='Identifier'][callee.name='RegExp'][arguments.0.type='TemplateLiteral']:has(TemplateElement[value.raw=/\\/])`,
          message:
            'Use String.raw for dynamic RegExp templates with backslashes so escapes stay readable.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^(sort|toSorted)$/][arguments.length=0]',
          message: 'Pass an explicit comparator (byCodeUnit in scripts/lib/repo-files.ts).',
        },
        {
          selector:
            "CallExpression[callee.type='Identifier'][callee.name=/^(parseInt|parseFloat|isNaN|isFinite)$/]",
          message: 'Use the Number.* form (Number.parseInt, Number.isNaN, …).',
        },
        {
          selector: String.raw`CallExpression[callee.property.name='replace'][arguments.0.regex.flags=/g/][arguments.0.regex.pattern=/^(?:[^\\[\]().*+?^$|{}]|\\[^dDwWsSbBpPuUxck0-9])+$/]`,
          message: "A global replace of literal text is replaceAll('text', …).",
        },
      ],
    },
  },
]);
