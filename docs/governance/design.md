# Daysforth design notes

The approved visual source is [the November 2026 wireframe set](../wireframes/approved/README.md).
Daysforth is a timeline-first social profile: a centered identity, photographic pinned moments,
and a chronological story that switches between Timeline and Posts. The older reading-first design
and wireframe experiments are historical. Preserve the approved composition when adding features.

## Foundations

- Inter Variable is the interface typeface. Atkinson Hyperlegible Mono remains only for the household
  org chart. Body text starts at 16 px with comfortable line spacing.
- White, ink, restrained blue, fine borders, and generous space establish the light theme. Dark mode
  uses slate surfaces and a lighter blue. Check contrast in both themes.
- The desktop profile and pins use an 800 px centered column; the feed uses 928 px. The timeline
  stays centered when the profile scrolls away. Secondary pages use a narrower reading column.
- Use the original Daysforth mark and wordmark from the [brand kit](../../public/brand/README.md).
  UI icons come from Phosphor. Use Carson's approved photos, never generated substitutes.
- Keep a feature’s layout in its owning stylesheet. `post-media.css` owns card media, overlays,
  reaction presentation, and illustrated-card columns; do not append competing overrides to
  `interaction.css` or `timeline.css`. Shared dialog, consent, and shortcut styles stay in
  `interaction.css`. Verify actual image bounds, unloaded targets, and both browsing presentations
  when changing media layout; matching selector names alone does not establish correct behavior.
  Shared fragment offsets live in `global.css` so section links clear the sticky header; the timeline
  dock owns its larger browsing offsets. Do not reintroduce shorter per-page offsets that hide headings.
- The approved refined D uses a connected inset timeline at 32 px and larger. Use the simplified
  three-moment drawing below 32 px and in browser favicons, including high-resolution favicon PNGs.
  Headers, app icons, lockups, and social artwork use the full timeline. Preserve the selected
  geometry in `docs/wireframes/approved/daysforth-logo-main.svg` and `daysforth-logo-small.svg`.

## Timeline behavior

- Every moment requires a confirmed month and year. Days are optional; never invent a date.
- The three pins are Born, Vanderbilt graduation, and Married Nicole. The rail labels only those
  three dates and positions them proportionally across the available months.
- The blue thumb supports dragging and keyboard input. Do not add “Drag to explore” hint text.
- Keep Timeline and Posts visible. Consolidate categories into one menu and date navigation plus
  date detail into a second. Keep native, labeled forms inside those menus.
- Years and quarters can collapse groups. Ordinary categories retain milestones; Milestones shows
  only milestones and Saved shows only browser-local bookmarks.
- Keep the date rail with the sticky browsing controls. Unstick them on short or heavily enlarged
  viewports so content remains usable.
- All covers open the matching post, with an expand icon and a photo count for albums. Preserve
  full subjects and use distinct album photos. Actual app interfaces carry their approved app icons.
- Corner controls follow the actual photo edge and slightly overlap it. Keep their visual badges
  small and interactive targets usable; reveal on event hover, keyboard focus, or deliberate touch.
  Titles and actions retain their ordinary first-click behavior.
- Newest/oldest shortcuts stay hidden above the story. Show them only after meaningful scrolling
  into the timeline and suppress a direction when that end is already reached.
- Work, Projects, and Life use matching icon/color chips in metadata and category choices. Labels
  carry the meaning independently of color. Profile identity and standalone destinations use quiet
  outlined chips, including on mobile.
- Post pages have a proportional date slider; keyboard arrows traverse actual events sharing a month.
  Earlier goes left and Newer goes right.
- Separate post metadata, title, caption, and actions with deliberate spacing. Both presentations
  share content and actions without duplicating state.
- URL state supports refresh and Back/Forward. Every moment has a permanent, shareable page.
- Without JavaScript, show a chronological, year-grouped story with ordinary permalink navigation.

## Personal albums

Life’s dog cards lead into their respective photo albums. Keep the existing primary portrait and
breed details. About’s additional-photo preview follows Quick facts, with its main portrait retained
in the introduction. Compact previews identify an album; do not repeat a long caption and link
block under each thumbnail. The opened viewer provides the larger image, caption, album position,
previous/next controls, arrow-key and swipe navigation, and a clearly labelled related moment when
one exists. Do not autoplay. Closing returns to the trigger without moving the background.

## Restraint and accessibility

Use photographs and typography for personality. Avoid dashboard chrome, decorative metrics,
gradients, fake browser frames, stock portraits, and unnecessary labels. Do not invent personal
facts, quotes, or engagement counts.

Keep visible control labels, keyboard access, clear focus, 44 px standalone targets, meaningful image
alternatives, reduced-motion support, and reflow at 320 px. Check enlarged text in both themes.
Follow [accessibility.md](accessibility.md); wireframes do not override those requirements.
Record visual comparisons and intentional differences in the project-root `design-qa.md`.
