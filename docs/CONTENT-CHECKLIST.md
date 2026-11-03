# Content checklist

What still needs Carson's input or approval before (or after) launch. Nothing on this list is
private; it is safe to keep in the public repository. Tick items off as they are resolved and update
the matching file in `src/data/`.

## Needs approval before launch

- [ ] **Headline.** The site uses "Technical Program & Product Leader" (approved as a public headline),
      not an official HR title. Confirm, or provide the exact title to use.
- [ ] **Booz Allen description.** The site says I coordinate software delivery across multiple engineering
      teams supporting the Department of Veterans Affairs, and lists general responsibilities only (`src/data/career.ts`). Confirm this is fine to publish under Booz Allen's
      social media and public-information guidance.
- [ ] **InfoWorks.** Described only as "consulting and business analysis" with one general sentence.
      Confirm the wording; add anything specific you want shown.
- [ ] **Nicole.** The site names Nicole as my wife and says we married in October 2026, and that
      PicPledge debuted at the wedding. Confirm Nicole is comfortable with this.
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
- [ ] **Project facts.** Status, stack, and links for TTSNative, Recalen, PicPledge, and Southern Surface
      Company come from your GitHub profile README. Metrics (testers, guests, leads) are deliberately
      left to the portfolio. Confirm `recalen.com`, `picpledge.com`, and `southernsurfacecompany.com`
      should be linked.
- [ ] **License.** MIT is recommended for the code (it matches TTSNative). Confirm before a `LICENSE`
      file is added. Personal content and photos stay unlicensed either way.

## Assets to provide

- [ ] **Portrait** of me: `src/assets/photos/carson-portrait.jpg` (square or 4:5, at least 1200 px).
- [ ] **Margot** and **Quinn** photos: `src/assets/photos/margot.jpg`, `src/assets/photos/quinn.jpg`.
- [ ] Optional **Nicole and me** photo, only with Nicole's approval:
      `src/assets/photos/nicole-and-carson.jpg`.
- [ ] Run `npm run images:strip` after adding any photo, before committing it.

## Optional details

- [ ] A public **email address** for the contact page (`profile.email` in `src/data/profile.ts`;
      currently none is shown).
- [ ] **Start dates** for Booz Allen and InfoWorks, if you want them on the work page.
- [ ] Specifics for interests: games you are playing, a watch you like, places you have traveled.
- [ ] Keep **Right now** (`src/data/life.ts`) current, and update its date when you do.
- [ ] Idea: a short **TTSNative audio sample** reading the homepage introduction aloud (with a
      transcript) would be a fitting signature detail. Record it with TTSNative and send the file.

## Accessibility sign-off

- [ ] Hand-test with VoiceOver (Safari on macOS and iOS) and NVDA (Windows), then update the
      limitations on the [accessibility statement](../src/data/accessibility.ts).
