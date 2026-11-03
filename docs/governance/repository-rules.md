# Repository rules

## Structure

- `src/data/` holds every piece of personal content. Pages and components read from it and contain
  no personal facts of their own.
- `src/lib/` holds all logic (URLs, metadata, theme, menu, motion, notices, images). Components stay
  thin; anything with a branch belongs in `src/lib` with tests.
- `scripts/` holds command-line entry points; their logic lives in `scripts/lib/` with tests.
- `tests/unit/` (Vitest), `tests/build/` (checks against the built site), `tests/e2e/` (Playwright).

## File size

The limit is **500 physical lines per first-party file**, blanks and comments included, across
TypeScript, Astro, CSS, YAML, JSON, Markdown, and configuration. Over 400 lines is reported for review.
Only the generated lockfile is exempt. Split by responsibility before reaching the limit; never minify.
Committed assets are capped too: 256 KB per file in `public/`, 1.5 MB per source image in `src/assets/`.

## File headers

Every hand-written file that can carry a comment opens with a header in its own comment syntax: a
`/** … */` block in TypeScript, JavaScript, CSS, and Astro frontmatter; `#` lines in YAML, TOML, and
ignore or config files; `//` lines in `tsconfig.json` and `.jsonc`. A shebang, `// @ts-check`, or the
Astro frontmatter fence stays first.

```ts
/**
 * Purpose: One sentence: what this file is or does.
 * Scope: The behavior or responsibility this file owns.
 * Constraints: Optional. Invariants, privacy limits, platform requirements.
 * Does NOT belong: Responsibilities that live elsewhere, and where.
 */
```

Strict JSON (`package.json`, `.prettierrc.json`, `.jscpd.json`, the web manifest), Markdown, `.nvmrc`,
lockfiles, and images are exempt. `npm run check:repo` enforces the shape; reviewers own the prose.

## Quality

- Strict TypeScript with unchecked index access and exact optional properties.
- Prettier and ESLint with zero warnings, strict jsx-a11y rules, no nested ternaries, explicit sort
  comparators, `replaceAll` for literal text, and no regexes that can backtrack super-linearly.
- **100% statements, branches, functions, and lines, per file**, for `src/lib`, `src/data`, and
  `scripts/lib`. If an extraction leaves a branch nothing can reach, delete the branch.
- No duplicated blocks (jscpd: five lines or fifty tokens) and no unused files, exports, or
  dependencies (Knip).
- Test behavior and failure paths, not implementation details.

## Dependencies

- Pinned exactly (`save-exact`), with the lockfile committed and no install scripts (`ignore-scripts`).
- A version must be at least 14 days old before it is adopted (`min-release-age=14` on npm 11+; on
  npm 10, install with `--before=<date 14 days ago>`).
- Security exceptions to the cooldown, recorded here:
  - `happy-dom@21.0.4` (2026-11-03): fixes GHSA-834v-8h66-3h79 (high) in 21.0.3. Test-only.
- Production dependencies must pass `npm audit --omit=dev --audit-level=high`. Known moderate advisories
  in development-only tooling (ESLint's `minimatch`) are tracked, not shipped.

## Privacy and security

- Never commit credentials, tokens, private addresses or phone numbers, or unapproved photos.
  `tests/unit/content.test.ts` scans for phone numbers, email addresses, street addresses, and
  credential patterns; gitleaks runs in CI.
- Strip photo metadata (`npm run images:strip`) before committing a photo.
- The site sets a strict Content-Security-Policy with hashed scripts and styles. Inline `style`
  attributes are not allowed; use classes.

## Completion

Run `npm run validate` for every change and `npm run validate:full` before merging. Report checks that
did not run. Keep [the content checklist](../CONTENT-CHECKLIST.md) current.
