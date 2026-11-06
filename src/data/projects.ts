/**
 * Purpose: Carson's personal software projects and the links to his portfolio and GitHub.
 * Scope: The project list with status, description, stack, artwork, and links, plus the copy that
 *   introduces it. Detailed metrics and case studies stay in the product portfolio on purpose.
 * Constraints: Never invent URLs, user counts, revenue, or release status.
 * Does NOT belong: Professional roles (src/data/career.ts) or page metadata (src/data/site.ts).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { projectRecords } from '../lib/content-records';

/**
 * Personal software projects. Facts and links come from Carson's public GitHub
 * profile and product portfolio. Detailed metrics and case studies stay in the
 * portfolio (https://carsonmcrae.github.io/) on purpose; this site links to it
 * rather than duplicating it.
 */

export const portfolioUrl = 'https://carsonmcrae.github.io/';
export const githubUrl = 'https://github.com/carsonmcrae';

export const projectsIntro = {
  title: 'What I’m building',
  body: 'I build software on my own time because I like knowing how things work all the way down. On these, I own the whole process: the idea, the product decisions, the design, the code, and the release.',
  portfolioNote:
    'The full case studies, with product decisions, walkthroughs, and engineering details, live in my product portfolio.',
};

export const projects = projectRecords({
  ttsnative: {
    identity: ['ttsnative-1', 'TTSNative', 'Open source'],
    copy: [
      'Natural text-to-speech that runs on your own computer.',
      'TTSNative reads PDFs, EPUBs, Word documents, and plain text aloud with read-along highlighting, plus optional, consent-based voice cloning. Your documents, voices, and audio stay on your computer. It’s free and MIT-licensed.',
      'I designed and built it end to end, from the reader and voice studio to the brand and the website.',
    ],
    stack: ['React', 'TypeScript', 'Python', 'FastAPI', 'ONNX Runtime'],
    links: [
      ['ttsnative.com', 'https://ttsnative.com'],
      ['Source', 'https://github.com/carsonmcrae/ttsnative'],
      ['Case study', 'https://carsonmcrae.github.io/ttsnative-case-study/'],
    ],
  },
  recalen: {
    identity: ['recalen-beta', 'Recalen', 'Private beta'],
    copy: [
      'Dump now. Recall later.',
      'A capture-and-recall app for thoughts, links, files, and voice notes, with organization, search, reminders, and calendar views across web and native mobile.',
      'Currently in an ongoing private beta.',
    ],
    stack: ['Next.js', 'TypeScript', 'React Native / Expo', 'PostgreSQL / Prisma'],
    links: [
      ['recalen.com', 'https://recalen.com'],
      ['Case study', 'https://carsonmcrae.github.io/recalen/'],
    ],
  },
  picpledge: {
    identity: ['picpledge-wedding', 'PicPledge', 'Live'],
    copy: [
      'Private photo sharing for events.',
      'Guests add photos to a shared album, can find photos of themselves with optional facial matching, and download the moments they want to keep.',
      'It launched at our own wedding. In my defense, it worked.',
    ],
    stack: ['React', 'TypeScript', 'Cloudflare Workers', 'Capacitor'],
    links: [
      ['picpledge.com', 'https://picpledge.com'],
      ['Case study', 'https://carsonmcrae.github.io/picpledge/'],
    ],
  },
  daysforth: {
    identity: ['built-daysforth', 'Daysforth', 'Live'],
    copy: [
      'Your life, as it unfolds.',
      'A timeline-first social profile for work, projects, and life. Switch between a chronological timeline and a photographic feed, and explore the moments along the way.',
      'You’re looking at it. Built with Astro, with shared reactions on Cloudflare.',
    ],
    stack: ['Astro', 'TypeScript', 'Cloudflare Workers', 'D1'],
    links: [
      ['Daysforth', 'https://wcarsonmcrae.com/'],
      ['Source', 'https://github.com/carsonmcrae/wcarsonmcrae'],
    ],
  },
});
