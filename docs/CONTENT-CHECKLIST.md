# Content checklist

What still needs Carson's input or approval before (or after) launch. Nothing on this list is
private; it is safe to keep in the public repository. Tick items off as they are resolved and update
the matching file in `src/data/`.

## Needs approval before launch

- [ ] **Headline.** The site uses "Technical Program & Product Leader" (approved as a public headline),
      not an official HR title. Confirm, or provide the exact title to use.
- [x] **Booz Allen description.** Approved (2026-11-03). The site says I coordinate
      software delivery across multiple engineering teams supporting the Department of Veterans Affairs,
      and lists general responsibilities only (`src/data/career.ts`).
- [ ] **InfoWorks.** Described only as "consulting and business analysis" with one general sentence.
      Confirm the wording; add anything specific you want shown.
- [x] **Nicole.** Approved as written (2026-11-03): Nicole is named as my wife, we married in October
      2026, and PicPledge debuted at the wedding.
- [ ] **Margot and Quinn.** Their field-guide entries use only the details provided (doodles, coat
      colors), a coat-color swatch, and the running joke that they run the household (including the
      ASCII org chart). There are no drawings of them. Confirm the tone.
- [ ] **Origin story.** The Minecraft server / Mineplex detail and the 2015 PC build come from your
      portfolio and GitHub README. Confirm they are fine here too.
- [ ] **Interests.** Fantasy football and pickleball come from your GitHub README; the rest come from
      the brief. Each line is a light first draft in your voice (`src/data/life.ts`); edit freely.
- [ ] **Jokes and voice.** Review the lines written for personality: the homepage heading ("Hey, I’m
      Carson. I help teams build complicated things, then go home and build more things."), the two
      doodles "who are fairly sure they run the place", "In my defense, it worked" (PicPledge), the
      interest one-liners, the org chart, the footer, the 404 page, the achievement notice, the console
      greeting, and the colophon line "That felt right for someone who builds a text-to-speech app."
- [ ] **Reused project assets.** The four app icons were copied from your public `carsonmcrae`
      repository. Confirm they can be used here.
- [x] **Project facts.** Status, stack, and links for TTSNative, Recalen, and PicPledge come from your
      GitHub profile README; metrics stay in the portfolio. Southern Surface Company is kept off the site
      for now (your call, 2026-11-03).
- [x] **License.** All rights reserved (2026-11-03). The repository is public only so GitHub Pages can
      host it for free; no reuse is granted, and no `LICENSE` file is added.
- [x] **Name and domains.** Daysforth is chosen and `daysforth.com` purchased. It is the canonical
      destination; `wcarsonmcrae.com` and `www` should forward there (2026-11-04).
- [x] **Timeline dates.** Month and year required; days optional. Born November 1999, PC December
      2015, Vanderbilt August 2018, InfoWorks June 2021, graduation May 2022, Margot July 2022,
      Booz Allen September 2022, Quinn July 2023, wedding October 2026. See `src/data/timeline.ts`.
- [x] **Wireframes.** Four approved references archived in `docs/wireframes/approved/`. Apply the
      post-spacing correction and omit the drag hint. Use the supplied real photos.

## Assets to provide

- [x] **Portrait** provided (`carson-headshot.jpg`), plus 16 more photos; see docs/HANDOFF.md for where each goes.
- [x] **Margot** and **Quinn** photos provided (`margot-1/2.jpg`, `quinn-1/2.jpg`).
- [x] **Wedding photos with Nicole** provided and approved (`nicole-carson-*.jpg`). Everyone pictured in
      every photo is approved for public use (2026-11-03).
- [x] Photos were imported with `npm run images:import`, which strips metadata and resizes.

## Optional details

- [ ] A public **email address** for the contact page (`profile.email` in `src/data/profile.ts`;
      currently none is shown).
- [x] **Start dates** for Booz Allen (September 2022) and InfoWorks (June 2021) confirmed.
- [ ] Specifics for interests: games you are playing, a watch you like, places you have traveled.
- [ ] Keep **Right now** (`src/data/life.ts`) current, and update its date when you do.
- [ ] Idea: a short **TTSNative audio sample** reading the homepage introduction aloud (with a
      transcript) would be a fitting signature detail. Record it with TTSNative and send the file.

## Accessibility sign-off

- [x] NVDA 2026.2 core timeline/control and action-feedback spot check on Windows, November 4, 2026.
      Findings and fixes are recorded in the project-root `design-qa.md`.

- [ ] Hand-test with VoiceOver (Safari on macOS and iOS), then update the
      limitations on the [accessibility statement](../src/data/accessibility.ts).
