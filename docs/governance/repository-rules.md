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
- **100% statements, branches, functions, and lines, per file**, for `src/lib`, `src/data`,
  `src/scripts`, typed page endpoints, all TypeScript scripts and JavaScript CLI entrypoints,
  Worker entrypoints, and the Astro/Playwright configurations. `vitest.config.ts` lists the executable
  scope. Composition tests cover adapter behavior at real IO boundaries. If an extraction leaves a
  branch nothing can reach, delete the branch.
- No duplicated blocks (jscpd: five lines or fifty tokens) and no unused files, exports, or
  dependencies (Knip).
- Test behavior and failure paths, not implementation details.
- Give route-wide browser sweeps one named test per route. A growing page list must not share one
  test’s time budget or stop later pages from being checked when an earlier page fails.
- Browser flows must finish native scroll/resize setup and observe a command's result before
  traversing history. A readiness marker or completed click dispatch does not acknowledge a deferred
  mutation. Reuse the native-event helpers; retain real input and state/focus assertions rather than
  adding sleeps, synthetic intent events, or weaker expectations.
- Built script budgets follow the complete emitted eager module graph, not only script-tag entry
  stubs; deferred edges must also resolve. Verify actual initial and conditional request waterfalls
  when changing loading boundaries. Framework configuration must be checked in emitted output.
- Published image reaction IDs remain supported after presentation retires. Append to
  `src/data/published-image-reactions.json`; `check:release` rejects removing reviewed base entries.
  New targets still require a compatible Worker before site publication.

### Prevent recurring scan findings

ESLint rejects functions above **20 modified cyclomatic complexity** and blocks nested more than
**four levels**. The modified metric counts a `switch` as one branch rather than charging every
case. These bounds apply to handwritten code, including tests and configuration; they prevent large
decision trees and deeply nested handlers from growing back after extraction. Split responsibilities
and test the resulting contracts instead of raising a limit or adding a suppression. Provider output
under `.wrangler/` is generated cache, like `dist/`, and is not first-party lint input.

The existing nested-ternary prohibition stays in place. Negated conditions with alternatives are
also rejected; early guard clauses remain useful. Static regex patterns use regex literals, while
dynamic `RegExp` template patterns containing backslashes use `String.raw` so escaping stays readable. Existing
regex backtracking guards, explicit sort comparators, literal `replaceAll`, strict a11y rules, and
zero-warning lint remain required. Behavioral tests in `tests/unit/lint-prevention.test.ts` exercise
the actual configuration at its boundaries and against examples of the recurring mistakes.

These local checks do not calculate Sonar’s cognitive complexity or structural regex complexity,
prove correct responsibility boundaries, or inspect historical HTML design-canvas scripts. A
requested full-scope scan remains necessary for those findings and for coverage/duplication across
its supported languages. Review findings on their evidence; do not add source, coverage, or
duplication exclusions to make a scan pass. Native element semantics, privacy behavior, dependency
advisories, and manual accessibility findings still need their respective checks and review.

## Dependencies

- Pinned exactly (`save-exact`), with the lockfile committed and no install scripts (`ignore-scripts`).
- A version must be at least 14 days old before it is adopted (`min-release-age=14` on npm 11+; on
  npm 10, install with `--before=<date 14 days ago>`).
- Security exceptions to the cooldown, recorded here:
  - `happy-dom@21.0.4` (2026-11-03): fixes GHSA-834v-8h66-3h79 (high) in 21.0.3. Test-only.
  - `minimatch@11.0.1` (2026-11-05): fixes CVE-2026-118764 in development tooling. The exact override
    crosses the upstream major boundary because no patched 10.x version is available; the full
    lint, duplication, build, and browser gates verify compatibility. Published October 27.
    Its required `@isaacs/nonrecursive-glob-match@1.0.3` dependency was published October 28 and is
    included in this same security-fix exception; `brace-expansion@5.0.12` meets the normal cooldown.
- `fflate@0.8.3` fixes CVE-2026-45820 in test/archive tooling and meets the normal cooldown.
- Production dependencies must pass `npm audit --omit=dev --audit-level=high`; requested full-scope
  security scans also include development dependencies. Do not silently accept known findings.

## Privacy and security

- Never commit credentials, tokens, private addresses or phone numbers, or unapproved photos.
  `tests/unit/content.test.ts` scans for phone numbers, email addresses, street addresses, and
  credential patterns; gitleaks runs in CI.
- Strip photo metadata (`npm run images:strip`) before committing a photo.
- Preserve first-party copyright/SPDX headers and [upstream licenses](../../COPYRIGHT.md).
- Keep product releases and [architecture documentation](../architecture/maintenance.md) current;
  [release checks](releases.md) enforce changes against the reviewed base in CI.
- The site sets a strict Content-Security-Policy with hashed scripts and styles. Inline `style`
  attributes are not allowed; use classes.

## Completion

Run `npm run validate` for every change and `npm run validate:full` before merging. Report checks that
did not run. Keep [the content checklist](../CONTENT-CHECKLIST.md) current.
