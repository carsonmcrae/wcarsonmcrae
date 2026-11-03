# Design brief: [App name], a timeline-first social network, shown through one real profile

## What this is

[App name] is a concept for a social network where **a profile is a timeline**. Every post sits at the date it happened; the feed is the person's life laid out in time, which you scroll through and zoom in and out of. There are no accounts, no comments, no messaging and no algorithm. There is exactly one profile: **Carson McRae** (carsonmcrae), and his profile page is also his personal website, wcarsonmcrae.com.

The site has two jobs at once: it must work as Carson's personal site (a recruiter arriving from his résumé should understand who he is within 15 seconds), and it must demonstrate the product idea convincingly, so that it feels like a real, working social app rather than a portfolio page with a timeline on it.

## What to deliver

Full wireframes, not sketches: every screen and state listed below, with real content (supplied here), real type sizes and spacing, and honest hierarchy. Grayscale is fine; one accent color is allowed. This is structure and interaction, not final visual styling.

Deliver **desktop (1440 px wide)** and **mobile (390 px wide)** versions of every screen. Also deliver a short written spec: layout grid, spacing scale, type scale, component inventory with states, and interaction notes. If you can produce a clickable HTML/CSS prototype of the feed with working zoom and filters, do; it will be implemented in Astro with plain TypeScript and CSS, no frameworks, so keep behaviour achievable with vanilla code.

Name every file by screen and breakpoint, e.g. `profile-desktop.png`, `profile-mobile.png`, `post-desktop.png`.

## The rules of the network

1. A profile has **one main photo**, a name, a handle, a headline, a short bio, and links.
2. A profile pins **three milestones**, each with a photo and a date. They sit on a small strip, placed proportionally by date, before the feed.
3. **Every post has a date** (year, or month and year). Posts never float free of time.
4. The feed is a **timeline**: a time axis with posts placed at their dates. The reader can **zoom** between at least three scales (years, quarters, months) and scroll through time. Zoomed out, posts cluster; zoomed in, they spread apart.
5. Posts have a **category**: Work, Projects, or Life, and may carry a **Milestone** flag. The feed can be filtered by category; milestones always stay visible.
6. **Reactions are shared**: counts are global and visible to everyone (stored by a small backend). A visitor can react once per post. There is also Save (stored only in the visitor's browser) and Copy link.
7. **Each post has its own page and address**, so it can be shared.
8. Everything must **work without JavaScript** as a plain chronological list, and must meet **WCAG 2.2 AA / Section 508**.

Categories and the Milestone flag are the only metadata; there are no tags, hashtags, locations or mentions.

## The real content to design with

Use these facts exactly; do not invent others. Where a photo is named, draw a placeholder with that label. Dates shown as "month year" or "year" are the level of detail that will be published.

**Profile**

- Name: Carson McRae. Handle: carsonmcrae. Location: Nashville, Tennessee.
- Headline: Technical Program & Product Leader.
- Bio (draft): "I help teams build complicated things, then go home and build more things. Booz Allen Hamilton by day; TTSNative, Recalen and PicPledge on nights and weekends."
- Links: LinkedIn, GitHub, Product portfolio, Contact.
- Household: Nicole (wife), and two doodles, Margot and Quinn. They do not get their own profiles.
- Main photo: [Portrait].

**Pinned milestones**

1. 1999 · Born · [Baby photo]
2. 2022 · Graduated from Vanderbilt University (Human & Organizational Development, Political Science) · [Graduation photo]
3. October 2026 · Married Nicole · [Wedding photo]

**Posts, oldest first** (category; Milestone where marked)

- 1999 · Born · Life · Milestone · [Baby photo]
- 2012 (exact date to be confirmed) · Built a Minecraft server, "Minetrocity", at 13, working with developers; it caught the attention of the creators of Mineplex · Projects
- 2015 · First PC build. "It was not the last." · Life · [PC build photo]
- 2018 · Started at Vanderbilt · Life
- 2021 · InfoWorks: consulting and business analysis · Work
- 2022 · Graduated from Vanderbilt · Work · Milestone · [Graduation photo]
- 2022 · Joined Booz Allen Hamilton: technical program and product leadership supporting the Department of Veterans Affairs · Work
- 2022 · Margot arrives (golden apricot doodle) · Life · [Margot photo]
- 2023 · Quinn arrives (black doodle with white markings) · Life · [Quinn photo]
- March 2026 · Started building TTSNative, a text-to-speech app that runs on your own computer · Projects
- April 2026 · Started building Recalen, a capture-and-recall app · Projects
- July 2026 · Recalen private beta begins · Projects
- September 2026 · Started building PicPledge, private photo sharing for events · Projects
- October 2026 · TTSNative 1.0 released as open source (MIT) · Projects · [TTSNative artwork]
- October 2026 · Married Nicole · Life · Milestone · [Wedding photo]
- October 2026 · PicPledge launched at the wedding. "Shipped software at my own wedding. In my defense, it worked." · Projects · [PicPledge photo]
- November 2026 · Built this site: "My own take on social media. You're looking at the prototype." · Projects

Several posts share October 2026; design for that collision.

## Screens and states required

1. **Profile / home.** Header with the app name and navigation (Timeline, Work, Life, About, Contact, light/dark switch). Profile block. Pinned milestone strip. Feed controls: category filter (All, Work, Projects, Life), zoom control, jump-to-year. The feed itself.
2. **Feed states.** Each zoom level (years, quarters, months) at both breakpoints. Each filter applied. A cluster of several posts in one month when zoomed out, and the same posts spread when zoomed in. A post pushed down the axis because an earlier one occupies its slot, with a visible tie back to its true date. An empty result (a filter with nothing in a visible range). The no-JavaScript fallback: the same posts as a plain list grouped by year.
3. **Post page.** Photo (if any), date, category, Milestone flag, title, caption, reaction control with its global count, Save, Copy link, previous and next post on the timeline, a strip showing where the post sits across the whole timeline, a link back to the feed scrolled to that date.
4. **Reaction states.** Before reacting, after reacting (count incremented, control marked pressed), and the saved state.
5. **Navigation.** Desktop header; mobile menu open and closed; the light and dark themes of the profile and post screens.
6. **Secondary pages**, same shell, simpler: Work (current role, background, skills, projects in detail), Life (Nicole, the dogs, interests), About, Contact, Accessibility statement, and a 404 page. One desktop and one mobile wireframe each is enough.
7. **Component sheet.** Post card (with photo, without photo, milestone), axis and tick labels for each zoom level, zoom control, filter chips (default, selected, focused), milestone marker, jump-to-year control, reaction button states, mobile sticky controls.

## Interaction details to resolve

- The timeline is vertical by default (newest at the bottom or the top: choose and justify). You may propose a horizontal overview strip for desktop in addition, never instead.
- Zoom is operated by visible − and + buttons with a label showing the current scale; mouse wheel or pinch may add to that but never replace it. Changing zoom keeps the reader anchored on the same date.
- On mobile, zoom and filters must stay reachable while scrolling a long feed without covering content.
- Dots on the axis mark true dates; cards may be displaced to avoid overlap, with a visible connector.
- Clustering when zoomed out: show how "4 posts · October 2026" expands.
- Jump links scroll the feed to a year.

## Accessibility requirements (non-negotiable)

Landmarks and one h1 per page; headings in order; real buttons and links; visible focus on everything; 44 × 44 px targets for standalone controls; text contrast 4.5:1 and control contrast 3:1 in both themes; filter state exposed as pressed, not by color alone; reduced-motion variant with no animation; the whole timeline usable with a keyboard alone; text reflows at 320 px and 200 % zoom; images have alt text; nothing auto-plays.

## Visual direction and constraints

- It should read as a real, restrained product someone would actually use, closer to a well-made utility than a flashy launch page.
- Typography-led. The site currently uses Atkinson Hyperlegible Next for everything (a typeface designed for low-vision readers; Carson builds a text-to-speech app, which is the point). Keep it unless you can argue for something better.
- Photos supply the color. Beyond that, a near-white ground, dark text, blue links, and at most one accent. Provide a dark theme.
- Avoid: gradient washes, glassmorphism, neon-on-black, cards inside cards, pill-shaped everything, icon tiles, stat grids, numbered feature cards, fade-in-on-scroll, emoji, fake avatars, stock photos, invented numbers, "Available for work" badges, tech-logo rows, and copy like "crafting delightful experiences".
- Do not add features that imply accounts (follow, DM, comments), and do not draw people. Photo placeholders are labelled boxes.

## How to send it back

Images for every screen and breakpoint, the written spec, and the prototype if you made one, as files. Add a short note listing every decision you made that this brief left open.
