# Handoff: state of the project on 2026-11-03

Read this first, then [AGENTS.md](../AGENTS.md). Everything below was decided by Carson in
conversation; nothing here is a guess. Commits are authored and committed by Carson only, with the
GitHub noreply address `65742229+carsonmcrae@users.noreply.github.com`, never a personal email, and
never with Co-Authored-By or "Generated with" lines.

## Where things stand

- Branch `claude/vibrant-heisenberg-ggf3kl` holds the whole site. Nothing is merged to `main`, GitHub
  Pages is not enabled, and DNS is untouched. `npm run validate` and `npm run test:e2e` pass.
- The current design is a reading-first personal site (Atkinson Hyperlegible Next, plain lists,
  underlined links). It is being replaced by the **timeline social-network redesign** described in
  [design-brief.md](design-brief.md), with the version 1 wireframes in [wireframes/](wireframes/).
  Carson is getting fuller wireframes from another agent before the build.
- **Photos:** 17 photos are on the branch in `src/assets/photos/` (commit `52a718b`, imported with
  `npm run images:import`: resized, metadata stripped). They are not yet placed on any page; the table
  below says where each goes.

## Decisions already made

Profile and dates (use these; do not change them without asking):

- Born: show **1999** only, never a date. Wedding: **October 2026** only.
- First PC build **2015** (Carson chose 2015 over the photo's "13" and an earlier 2013 answer).
- Started at Vanderbilt **2018**; graduated **2022**. InfoWorks **2021**. Booz Allen Hamilton **2022**.
- Margot arrived **2022**; Quinn **2023**. They do **not** get their own profiles or timelines.
- Minecraft server "Minetrocity": published **22 February 2014** (Minecraft 1.7.4). Mention it by name
  and date; **do not link** the Planet Minecraft page (it exposes an old gaming handle).
- TTSNative: first commit **24 March 2026**; v1.0.0 public release **19 October 2026** (v2.1.0 on
  23 October). Recalen: started **April 2026**, private beta **July 2026**. PicPledge: first commit
  **17 September 2026**, launched at the wedding in **October 2026**. App dates come from GitHub.
- **Southern Surface Company stays off the site** entirely for now.
- Hobby photos stay on the Life page with "since" dates, not as timeline posts: Hamilton watch
  **2025**, golf since **August 2026**, pickleball since **May 2026**.
- Booz Allen role is described without team counts or "Agile Release Train" wording (the old wording
  was also scrubbed from git history).
- Code is **all rights reserved** (no LICENSE file; `package.json` says UNLICENSED).
- **Shared reactions are approved**: a small Cloudflare Worker (free tier, Carson's account) stores
  per-post reaction counts with rate limiting; one reaction per post per browser; Save stays
  browser-only. The site must keep working if the worker is unreachable. Not built yet.
- Domain: `wcarsonmcrae.com`, apex, with `www` redirecting to it. Setup steps are in
  [DEPLOYMENT.md](DEPLOYMENT.md). Carson's registrar is GoDaddy.

Photos (all approved by Carson for public use, including everyone pictured):

| File in `src/assets/photos/`                                                                       | Intended place                                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `carson-headshot.jpg`                                                                              | Main profile photo                                           |
| `carson-solo.jpg`                                                                                  | About page                                                   |
| `1999-born.jpg`                                                                                    | Milestone 1 and the 1999 post                                |
| `2022-vanderbilt-graduation.jpg`                                                                   | Milestone 2 and the graduation post                          |
| `nicole-carson-1.jpg`, `nicole-carson-2.jpg`, `nicole-carson-b-w-1.jpg`, `nicole-carson-b-w-2.jpg` | Wedding: milestone 3 and its post (these are wedding photos) |
| `margot-1.jpg`, `margot-2.jpg`                                                                     | "Margot arrives" (2022) and the Life page                    |
| `quinn-1.jpg`, `quinn-2.jpg`                                                                       | "Quinn arrives" (2023) and the Life page                     |
| `my-first-built-pc-13.jpg`                                                                         | First PC build post (2015)                                   |
| `hamilton-murph-watch.jpg`                                                                         | Watches, Life page (2025)                                    |
| `carson-golf-brother.jpg`                                                                          | Golf, Life page (since August 2026)                          |
| `carson-pickleball.jpg`                                                                            | Pickleball, Life page (since May 2026)                       |
| `carson-friends.jpg`                                                                               | Life page                                                    |

Captions: Carson asked for drafts in his voice; he will edit.

## Social network name

Not chosen. The app is "[App name]" in the brief and wireframes. As of 2026-11-03 these .coms were
unregistered: thenline, lifetraced, chronoscroll, thenfeed, yearfeed, lifeplotted, kronofeed,
hindsightfeed. Ninety other candidates were already taken. Another agent is handling the name.

## What is next

1. Full wireframes from the other agent, then Carson's approval.
2. Build the redesign per the brief, keeping every gate green (100% per-file coverage, no duplicate
   code, Section 508 / WCAG 2.2 AA, the plain-list fallback, both builds). Raise the per-page script
   budget in `tests/build/budgets.test.ts` deliberately when the timeline needs it.
3. Place the photos with captions (see the table above).
4. Build the reactions worker in its own small repository.
5. Merge to `main`, enable Pages, then the GoDaddy DNS steps in [DEPLOYMENT.md](DEPLOYMENT.md).

Open items that still need Carson: nothing blocking, other than the name and the wireframes.
