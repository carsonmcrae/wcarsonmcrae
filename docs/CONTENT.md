# Updating content

Everything personal lives in `src/data/`. Change a string there, run `npm run dev`, and every page that
uses it updates. Pages and components contain no personal facts of their own.

| File                        | What it holds                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/data/profile.ts`       | Name, headline, portrait and email settings, social links, homepage intro, "What I actually do" |
| `src/data/career.ts`        | Roles, education, skills, tools, the About page, timeline, principles, quick facts              |
| `src/data/projects.ts`      | Projects, in display order                                                                      |
| `src/data/life.ts`          | Nicole, Margot and Quinn, the org chart, interests, "Right now"                                 |
| `src/data/site.ts`          | Navigation, page titles and descriptions, contact copy, footer, 404, achievement                |
| `src/data/accessibility.ts` | The accessibility statement and colophon                                                        |

## Writing rules

- Use contractions and typographic apostrophes (`’`), the way you talk.
- Text fields marked "inline markdown" accept `[links](/work/)`, `*emphasis*`, and `**strong**`.
  Internal links start with `/` and get the deployment base path automatically.
- Keep facts accurate and public-safe. Unconfirmed details go in
  [the checklist](CONTENT-CHECKLIST.md), not on the site.
- `npm run test` checks every link, flags buzzwords, and scans for phone numbers, email addresses,
  street addresses, and credentials.

## Photos

Photos are optional. The site reads naturally without them, and each one appears automatically
once its file exists.

| Photo             | File (any of .jpg, .png, .webp, .avif)    | Where it appears                          |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| Carson            | `src/assets/photos/carson-portrait.jpg`   | Small portrait on the homepage            |
| Margot            | `src/assets/photos/margot.jpg`            | Margot’s entry on the Life page           |
| Quinn             | `src/assets/photos/quinn.jpg`             | Quinn’s entry on the Life page            |
| Nicole and Carson | `src/assets/photos/nicole-and-carson.jpg` | The Nicole section, only with Nicole’s OK |

Before committing any photo:

1. Make sure it is approved for a public website.
2. Run `npm run images:strip` to remove location, camera, and timestamp metadata.
3. Keep originals under 1.5 MB (`npm run check:repo` enforces this). Astro resizes and converts them
   to AVIF and WebP at build time.
4. Update the alt text in the matching data file if the default does not describe the photo.

## Adding a project

Add an entry to `projects` in `src/data/projects.ts`. Put its app icon (square PNG, at least 64 px)
in `src/assets/projects/` and set `icon` to the filename without the extension. The first link is
written first in the "See …" sentence, so lead with the project's own website.

## Adding an interest

Add an entry to `interests` in `src/data/life.ts`. Its `id` becomes an anchor (`/life/#id`) that
the homepage's "Off the clock" section can link to.

## Keeping "Right now" fresh

Edit `now.items` and `now.updated` in `src/data/life.ts` whenever something changes.
