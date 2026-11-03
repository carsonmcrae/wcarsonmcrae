# Design notes

The site is **plain web, set for reading**. Carson builds a text-to-speech app, so the site takes its
form from readability: one typeface designed for legibility, prose and plain lists, underlined links,
and nothing that exists only to decorate. It should read like a person's own website, never like a
template.

## The system

- **Type.** Atkinson Hyperlegible Next for everything; Atkinson Hyperlegible Mono only for the ASCII
  org chart. 18 px body at 1.6 line height. Hierarchy comes from size and weight, never from labels.
- **Color.** White paper and slate dark mode (not black). Body text, a muted grey, link blue, a
  distinct visited purple, and hairline rules. There is no accent color beyond the links.

  | Role       | Light     | Dark      |
  | ---------- | --------- | --------- |
  | Background | `#ffffff` | `#1d2126` |
  | Text       | `#1b1d20` | `#e6e8eb` |
  | Muted      | `#555b63` | `#a9b0b8` |
  | Link       | `#1a55c0` | `#8db8ff` |
  | Visited    | `#6b3e8c` | `#cda8ee` |
  | Rule       | `#dfe3e8` | `#3a414a` |

  Text and links meet 4.5:1 in both themes; links are always underlined, because their contrast
  against body text alone is not enough.

- **Layout.** One left-aligned reading column (about 37 rem) inside a 64 rem page. Every page opens
  with a full-sentence `h1`, then sections with plain `h2` headings.
- **Controls.** Rectangular, 4 px radius, 44 px tall, with visible text labels.

## Signature details

- Full-sentence headings ("Hey, I'm Carson. I help teams build complicated things, …").
- Hobbies on the homepage link to their own entries on the Life page.
- "Explain it in: Plain English / Engineer-speak", built from native radio buttons.
- Field-guide entries for Margot and Quinn with coat-color swatches, and an ASCII household org chart.
- A dated "Right now" list, a colophon on the accessibility page, and "Updated" in the footer.
- Visited links in their own color. The homepage prints as a one-page résumé.
- The footer is signed "Supervised by Margot and Quinn."

## Avoid

These patterns make a site read as generated or templated. Do not add them.

- Cream backgrounds with a soft serif and a terracotta accent; indigo or violet gradients; gradient
  text; near-black pages with one neon accent; glassmorphism or glow shadows.
- Monospace uppercase "eyebrow" labels above headings; italic accent-colored words in headlines.
- Cards for everything, cards inside cards, pill buttons and pill chips, icons in tinted squares,
  "Available for work" badges, status-chip piles.
- Big-number stat grids, numbered "01 / 02 / 03" feature cards, logo or tech-stack grids,
  contribution graphs, now-playing widgets, typewriter job titles, fake terminal or browser chrome.
- Fade-up-on-scroll for every section, count-up numbers, bouncy easing.
- Metadata strung together with middle dots, an arrow on every link, a four-column footer.
- Copy tricolons ("Builder. Leader. Dog dad."), "I craft delightful experiences", "not just X, it's Y".
- Stock photos, or any image that could be mistaken for a real photo of Carson, Nicole, or the dogs.

When in doubt, write a better sentence instead of adding a component.
