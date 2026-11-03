# wcarsonmcrae.com

The personal website of Carson McRae: what I do, what I build, and who I am outside of work.
It's a static site built with [Astro](https://astro.build), published to GitHub Pages, and served at
[wcarsonmcrae.com](https://wcarsonmcrae.com).

Looking for my software projects? They live in my [product portfolio](https://carsonmcrae.github.io/)
and on [GitHub](https://github.com/carsonmcrae).

## Quick start

Requires Node 22.23.4 or newer (`.nvmrc` pins 24 for CI) and npm 10 or newer.

```bash
npm ci
```

```bash
npm run dev
```

Open http://localhost:4321. To preview the production build:

```bash
npm run build && npm run preview
```

## Checks

| Command                      | What it does                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run validate`           | Everything below except browser tests and the audit                                                   |
| `npm run validate:full`      | `validate`, plus browser and accessibility tests and `npm audit`                                      |
| `npm run validate:static`    | Format, lint, line limits, headers, asset sizes, duplication, unused code, types                      |
| `npm run test:coverage`      | Unit tests; 100% statements, branches, functions, and lines per file                                  |
| `npm run test:build`         | Checks the built site: links, metadata, sitemap, budgets                                              |
| `npm run test:build:subpath` | Builds and checks the site under `/wcarsonmcrae/`, as GitHub Pages serves it before the custom domain |
| `npm run test:e2e`           | Playwright and axe in desktop Chromium, mobile Chromium, and (in CI) mobile WebKit                    |

Run `npm run build` before `npm run test:e2e`. Set `SCREENSHOTS=1` to save full-page screenshots of
every page at six widths in both themes to `screenshots/`. Browser tests need Playwright's browsers
(`npx playwright install chromium webkit`).

## Project structure

```text
src/
  data/         All personal content: profile, career, projects, life, site copy
  lib/          Logic: URLs, metadata, theme, menu, motion, notices, images (fully tested)
  components/   Astro components (presentation only)
  layouts/      The page shell
  pages/        One file per route, plus robots.txt
  styles/       Design tokens and global styles
  assets/       Project artwork and (once approved) photos, optimized at build time
  scripts/      The browser entry point
public/         Icons, social preview image, web manifest (served as-is)
scripts/        Repository gates, image tools, and the subpath build check
tests/          unit/ (Vitest), build/ (built output), e2e/ (Playwright + axe)
docs/           Deployment, content guide, checklist, and governance
```

## Updating content

Everything personal lives in `src/data/`. Edit a string there and every page that uses it updates.
See [docs/CONTENT.md](docs/CONTENT.md) for adding photos, projects, and interests, and
[docs/CONTENT-CHECKLIST.md](docs/CONTENT-CHECKLIST.md) for what still needs confirmation.

## Deployment

A push to `main` runs the full quality gate, then deploys to GitHub Pages. Setup, the custom domain,
DNS records, and HTTPS are covered step by step in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Standards

This repository follows the same rules as my other projects: 500-line files with documentation
headers, 100% per-file coverage, no duplicated code, strict linting, exactly pinned dependencies with a
14-day cooldown, SHA-pinned GitHub Actions, and Section 508 / WCAG 2.2 AA accessibility. See
[AGENTS.md](AGENTS.md), [repository rules](docs/governance/repository-rules.md),
[accessibility](docs/governance/accessibility.md), and [SECURITY.md](SECURITY.md).

## License

The license for the source code has not been chosen yet. Until it is, all rights are reserved.

Whatever license the code ends up under, it will not cover my name, likeness, photographs, personal
content, or the names and logos of my products. Those are not licensed for reuse.
