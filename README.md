# Daysforth

Carson McRae's story in a centered, photo-rich timeline. Switch between Timeline and Posts, jump
through dates, and open a permanent page for any moment. Built with [Astro](https://astro.build)
for free GitHub Pages hosting at [wcarsonmcrae.com](https://wcarsonmcrae.com).
[Daysforth.com](https://daysforth.com) forwards to the same canonical site.

See the [current release notes](https://wcarsonmcrae.com/releases/1.0.0/),
[architecture](docs/architecture/overview.md), [release rules](docs/governance/releases.md), and
[security policy](SECURITY.md). Fixes for this project are welcome under [CONTRIBUTING.md](CONTRIBUTING.md).

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
Set `PW_WEBKIT=1` to include WebKit locally. Browser tests generate a temporary loopback HTTPS
certificate using OpenSSL (bundled with Git for Windows; override `OPENSSL_PATH` if needed).
They do not install a trust root or change the production Content Security Policy.

For browser verification, set `PUBLIC_REACTIONS_URL=https://reactions.daysforth.test` in your shell
before both the build and browser commands (or `npm run validate:full`). CI’s browser job does this
automatically. Photo-reaction tests intercept that reserved endpoint before navigation and require
it to be configured; they never send votes to the live Worker. Use the real service URL only for
an explicitly authorized production build.

## Project structure

```text
src/
  data/         All personal content, timeline dates, photo galleries, and brand tokens
  lib/          Logic: URLs, metadata, theme, menu, motion, notices, images (fully tested)
  components/   Astro components (presentation only)
  layouts/      The page shell
  pages/        One file per route, plus robots.txt
  styles/       Design tokens and global styles
  assets/       Approved photos, project artwork, and the licensed outline-source font
  scripts/      The browser entry point
public/         Icons, social preview, manifest, and downloadable brand kit
scripts/        Repository gates, image tools, and the subpath build check
tests/          unit/ (Vitest), build/ (built output), e2e/ (Playwright + axe)
docs/           Deployment, content guide, checklist, and governance
workers/        Free shared-reactions API and D1 migration
```

## Updating content

Everything personal lives in `src/data/`. Edit a string there and every page that uses it updates.
See [docs/CONTENT.md](docs/CONTENT.md) for adding photos, projects, and interests, and
[docs/CONTENT-CHECKLIST.md](docs/CONTENT-CHECKLIST.md) for what still needs confirmation.

## Deployment

A push to `main` runs the full quality gate, then deploys to GitHub Pages. Setup, the custom domain,
DNS records, and HTTPS are covered step by step in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
Carson controls releases; an agent may perform a specific release only with his explicit authorization.

See [docs/DAYSFORTH.md](docs/DAYSFORTH.md) for the approved design, confirmed dates, photo protection,
and brand system. Preview the brand guide at `/brand/`; `npm run images:brand` regenerates its vector,
PNG, icon, and ZIP exports. Shared reactions require the separately deployed
[Worker/D1 service](workers/reactions/README.md). Save stays browser-local, with optional persistence
off until permission. See the [privacy review](docs/PRIVACY-REVIEW.md) and
[November 4 polish update](docs/POLISH-UPDATE.md).

## Standards

This repository follows the same rules as my other projects: 500-line files with documentation
headers, 100% per-file coverage, no duplicated code, strict linting, exactly pinned dependencies with a
14-day cooldown, SHA-pinned GitHub Actions, and Section 508 / WCAG 2.2 AA accessibility. See
[AGENTS.md](AGENTS.md), [repository rules](docs/governance/repository-rules.md),
[accessibility](docs/governance/accessibility.md), and [SECURITY.md](SECURITY.md).

## License

Copyright © 2026 William Carson McRae. All rights reserved.

This public, source-available repository is for review, free hosting, and contributions to Carson’s
site. External reuse or independent deployment requires permission. Limited permission to test and
submit a fix is described in [LICENSE.md](LICENSE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
[COPYRIGHT.md](COPYRIGHT.md) preserves third-party licenses and supplied media ownership.
