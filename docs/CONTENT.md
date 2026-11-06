# Updating content

Everything personal lives in `src/data/`. Change a string there, run `npm run dev`, and every page that
uses it updates. Pages and components contain no personal facts of their own.

| File                               | What it holds                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/data/profile.ts`              | Name, headline, portrait and email settings, social links, homepage intro, "What I actually do" |
| `src/data/career.ts`               | Roles, education, skills, tools, the About page, timeline, principles, quick facts              |
| `src/data/projects.ts`             | Projects, in display order                                                                      |
| `src/data/life.ts`                 | Nicole, Margot and Quinn, the org chart, interests, "Right now"                                 |
| `src/data/site.ts`                 | Navigation, page titles and descriptions, contact copy, footer, 404, achievement                |
| `src/data/accessibility.ts`        | The accessibility statement and colophon                                                        |
| `src/data/timeline.ts`             | Core moments, confirmed dates, categories, pins, captions, and photo references                 |
| `src/data/timeline-experiences.ts` | Confirmed education, awards, work, travel, and hobby additions                                  |
| `src/data/post-aliases.ts`         | Permanent redirects from retired app-start events to their release events                       |
| `src/data/photo-gallery.ts`        | Approved wedding, dog, and hobby gallery photos                                                 |
| `src/data/brand.ts`                | Daysforth name, domains, palette, typography, voice, and asset inventory                        |

## Writing rules

- Use contractions and typographic apostrophes (`’`), the way you talk.
- Text fields marked "inline markdown" accept `[links](/work/)`, `*emphasis*`, and `**strong**`.
  Internal links start with `/` and get the deployment base path automatically.
- Keep facts accurate and public-safe. Unconfirmed details go in
  [the checklist](CONTENT-CHECKLIST.md), not on the site.
- `npm run test` checks every link, flags buzzwords, and scans for phone numbers, email addresses,
  street addresses, and credentials.

## Photos

All 62 supplied photographs are approved for public use, including everyone pictured. Original
incoming files are ignored and protected by a verified external backup. Never replace them during
an update. The imported, metadata-stripped copies live in `src/assets/photos/`.

The November 5 batch adds 21 originals: eight Carson gallery photos, six per dog, and the horizontal
first-watch image. Their separate SHA-256 verified backup is `daysforth-photos-backup-20261105`
under the task’s external visualization workspace. The original 39 files remain unchanged.

The two additional family originals, `Me_My_Family.jpg` and `Me_Nicoles_Family.jpg`, are approved
for public use and backed up with verified SHA-256 hashes in `daysforth-photos-backup-20261105-family`
under that same external workspace. The 62 incoming originals remain unchanged. Their normalized,
metadata-stripped copies are `me-my-family.jpg` and `me-nicoles-family.jpg`; both appear at the bottom
of Life and in the wedding album as distinct group photographs.

| Photo              | File (any of .jpg, .png, .webp, .avif)             | Where it appears                               |
| ------------------ | -------------------------------------------------- | ---------------------------------------------- |
| Carson             | `carson-profile.jpg`, `carson-solo.jpg`            | Derived profile crop and About portrait        |
| Birth / graduation | `1999-born.jpg`, `2022-vanderbilt-graduation.jpg`  | Pins and timeline moments                      |
| Margot / Quinn     | `margot-1/2.jpg`, `quinn-1/2.jpg`                  | Timeline, Life entries, and gallery            |
| Wedding            | `nicole-carson-*.jpg`                              | Wedding pin, moment, Life section, and gallery |
| PC / hobbies       | `my-first-built-pc-13.jpg`, remaining hobby photos | PC moment and Life gallery                     |

Before committing any photo:

1. Make sure it is approved for a public website.
2. Run `npm run images:strip` to remove location, camera, and timestamp metadata.
3. Keep originals under 1.5 MB (`npm run check:repo` enforces this). Astro resizes and converts them
   to responsive WebP at build time.
4. Update the alt text in the matching data file if the default does not describe the photo.

## Adding a project

Add an entry to `projects` in `src/data/projects.ts`. Put its app icon (square PNG, at least 64 px)
in `src/assets/projects/` and set `icon` to the filename without the extension. The first link is
written first in the "See …" sentence, so lead with the project's own website.

## Adding an interest

Add an entry to `interests` in `src/data/life.ts`. Its `id` becomes a stable Life page anchor.

## Adding a moment

Add an entry to the core moments in `src/data/timeline.ts` or the confirmed additions in
`src/data/timeline-experiences.ts`. Require `YYYY-MM`; use `YYYY-MM-DD` only
when the day is confirmed. The ID becomes `/posts/<id>/`, so keep it stable after publication.
Choose Work, Projects, or Life. Keep exactly the three approved pins unless Carson changes them.
Do not invent captions, dates, or reaction counts. Update tests for intentional content changes.

Every event has a linked cover. Use `gallery` for distinct additional photos, with descriptive alt
text and captions; do not repeat a cover or include color and black-and-white copies of the same
wedding photograph. `imageKind: 'screen'` resolves a real interface capture from `src/assets/projects/`.
Use `endDate` only when Carson confirms it. Each app has one release, launch, or beta event; preserve
retired permalinks with `post-aliases.ts` and their accessible redirect pages.

Cover proportions are derived from the approved image metadata into `media-frames.css`. Do not
hand-copy ratios into content or compensate for late image layout with scrolling delays. Verify
that a selected moment stays visible when its images are delayed and then finish loading.

Personal album entries group native photo links for the shared carousel. Dog albums include both
original photographs and six additions each; Carson’s About album contains eight. Keep stable album
IDs, distinct image URLs, meaningful alternatives, and related post IDs where confirmed. Compact
previews have no per-image caption blocks; captions appear in the viewer. About’s preview follows
Quick facts, and the main portrait stays in the introduction. Every photo remains reachable without
JavaScript; do not replace hidden preview links with an image list held only in browser code.

The 24 dog and Carson album captions use Carson’s supplied descriptions. Keep the glasses mapped
to `margot-2` and `quinn-1`; Margot is not wearing a bow tie. `carson-gallery-7` shows gaming with
Jackson, and `carson-gallery-6` is the Nashville SC game where Carson first saw Messi in person.
Do not infer an exact match date or opponent. The Life hobby introduction includes the confirmed
travel total of over 15 countries.

## Keeping "Right now" fresh

Edit `now.items` and `now.updated` in `src/data/life.ts` whenever something changes.

## Release dates

Release records carry permanent date-only values. Version 1.0.1 uses November 5, 2026, as Carson
requested; version 1.1.0 uses the same preparation date. Version 1.0.0 uses November 3, 2026: the
earliest retained GitHub `PushEvent` is `2026-11-03T19:03:19Z`, still November 3 in America/Chicago.
The original root commit’s `pushedDate` was unavailable. Repository creation and converting UTC
midnight to a local previous day were not used as evidence. These displayed dates do not alter tags.
