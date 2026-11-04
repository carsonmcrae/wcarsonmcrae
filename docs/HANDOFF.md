# Handoff: Daysforth, 2026-11-04

Read [AGENTS.md](../AGENTS.md), [DAYSFORTH.md](DAYSFORTH.md), and
[the approved wireframe notes](wireframes/approved/README.md). Carson chose and purchased
**daysforth.com**. Naming research and the earlier Thenroll experiments are finished.

## Checkout and release

- Fast-forwarded the original checkout from `52a718b` to remote `c02ec77` before implementation.
- Work is on `codex/daysforth`. The remote default is `claude/vibrant-heisenberg-ggf3kl`; no `main`
  exists yet. Do not mistake that historical branch for the reviewed release.
- All 17 incoming originals were copied outside the checkout and SHA-256 verified before pulling.
  Originals remain ignored and unchanged. Published source photos are metadata-stripped.
- The static app, brand exports, and reactions service are implemented for review. Deployment,
  Pages settings, and DNS remain owner actions. See `design-qa.md` for actual verification status.

## Confirmed content

`src/data/timeline.ts` is the source of truth; the full date table is in [DAYSFORTH.md](DAYSFORTH.md).
Every moment requires month and year. New confirmations replace old year-only instructions:
born **November 1999**, first PC **December 2015**, Vanderbilt start **August 2018**, InfoWorks
**June 2021**, graduation **May 2022**, Margot **July 2022**, Booz Allen **September 2022**, and
Quinn **July 2023**. Wedding remains **October 2026**. Never invent a day.

Minetrocity was published 22 February 2014; do not link the old gaming profile. TTSNative began
24 March 2026 and released v1 on 19 October. Recalen began April 2026 and entered private beta
July 2026. PicPledge began 17 September 2026 and debuted at the October wedding. Southern Surface
Company stays off the site. Employer copy stays general and public-safe.

All 17 photos and everyone pictured were approved for public use. The derived profile crop comes
from the approved headshot. Wedding, dog, and hobby photos are placed on their matching moments
and secondary pages. Keep personal content in `src/data/`.

## Approved design

- Use the four PNG references in `docs/wireframes/approved/`, not older wireframes.
- Center the profile, pins, rail, and feed; no permanent left profile sidebar.
- Show only the three pinned dates on the rail. No “Drag to explore” hint.
- Keep the two views visible; consolidate remaining controls into category and date menus.
- Separate post metadata, title, caption, and actions with comfortable spacing.
- Use real photos, Phosphor icons, Inter, and the original Daysforth identity. Preserve both themes,
  native controls, keyboard access, and the no-JavaScript fallback.

## Operations and review

The frontend uses free GitHub Pages. The free Cloudflare Worker/D1 implementation is under
`workers/reactions`; a separate backend repository is unnecessary. Save is browser-only; shared
counts require the deployed API and `PUBLIC_REACTIONS_URL`.

Only Carson merges, deploys, tags, or changes settings/DNS. Commits use his GitHub noreply identity
`65742229+carsonmcrae@users.noreply.github.com`, without co-author or generated trailers.
No paid upgrade is authorized. Keep the separate GitHub portfolio repository unchanged.

Run `npm run validate:full` and record results in `design-qa.md`. The NVDA core-flow spot check is
recorded there; VoiceOver on macOS/iOS remains required before release sign-off. Review
[CONTENT-CHECKLIST.md](CONTENT-CHECKLIST.md).
