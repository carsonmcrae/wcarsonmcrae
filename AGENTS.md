# Working on wcarsonmcrae.com

Instructions for anyone changing this repository, people and coding agents alike. Read
[repository rules](docs/governance/repository-rules.md) and [accessibility](docs/governance/accessibility.md)
before changing code, and [content](docs/CONTENT.md) before changing copy or photos.

## What this is

Carson McRae's personal website: a static Astro site, published to GitHub Pages from this public
repository and served at https://wcarsonmcrae.com. Every file here is public and permanent.

## How changes land

- Commits are authored by Carson's identity only. No co-author trailers, "Generated with" lines, or
  bot commits. Dependency updates are re-applied in an owner-authored commit.
- Only Carson merges to `main`, deploys, tags, or changes repository settings, Pages settings, or DNS.
  A push to `main` deploys the site.
- Work on a branch. Run `npm run validate` for every change and `npm run validate:full` (adds browser,
  accessibility, and audit checks) before merging. Report any check that did not run, and why.

## Gates

- Maximum **500 physical lines** per first-party file (`npm run check:repo`). Split by responsibility.
- Every hand-written file that can carry a comment opens with a **Purpose / Scope / Does NOT belong**
  header (optional Constraints). Write it from the file itself and keep it accurate.
- **100% statements, branches, functions, and lines per file** for `src/lib`, `src/data`, and
  `scripts/lib`. Never lower a threshold, exclude a file, or add a hollow test; extract and test logic.
- **No copied code** (`npm run check:duplicates`). Extract the shared piece; never raise a threshold.
- ESLint and Prettier with zero warnings, strict TypeScript, no unused files, exports, or dependencies.
- Pages meet **Revised Section 508 and WCAG 2.2 AA** in both themes. Automated checks alone do not prove
  conformance; record what was checked by hand.
- Performance budgets for every built page (`tests/build/budgets.test.ts`) and size caps for committed
  assets.

## Content, privacy, and design

- Personal facts come from Carson. Never invent stories, quotes, metrics, titles, dates, or traits, and
  never describe client work beyond what is public. Unconfirmed items go in
  [the content checklist](docs/CONTENT-CHECKLIST.md), not on the site.
- No home address, phone number, private email, credentials, or unapproved family photos. Run
  `npm run images:strip` on every photo before committing it.
- Follow the [design notes](docs/governance/design.md); the site should never read as a template.
- Dependencies are pinned exactly and must be at least 14 days old, except for security fixes, which
  are recorded in [repository rules](docs/governance/repository-rules.md#dependencies).
