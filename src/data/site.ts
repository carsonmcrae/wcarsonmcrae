/**
 * Purpose: Site-wide settings and the copy shared across pages.
 * Scope: Site name and defaults, navigation, page titles and descriptions, contact page copy,
 *   footer, 404, and the achievement notice.
 * Does NOT belong: Personal or professional content (the other files in src/data).
 */
import type { LinkItem } from './types';

export const site = {
  name: 'Daysforth',
  /** Default title for the homepage and link previews. */
  defaultTitle: 'Carson McRae · Daysforth',
  locale: 'en_US',
  language: 'en',
  repositoryUrl: 'https://github.com/carsonmcrae/wcarsonmcrae',
  /** Social preview image in `public/`. Regenerate with `npm run images:brand`. */
  ogImage: '/og-image.png',
  ogImageAlt: 'The Daysforth logo and the words Your life, as it unfolds.',
  themeColor: { light: '#ffffff', dark: '#1d2126' },
};

/** Primary navigation. Every page here must exist in `src/pages/`. */
export const navigation = [
  { label: 'Timeline', href: '/', icon: 'timeline' },
  { label: 'Work', href: '/work/', icon: 'work' },
  { label: 'Life', href: '/life/', icon: 'life' },
  { label: 'About', href: '/about/', icon: 'about' },
  { label: 'Contact', href: '/contact/', icon: 'contact' },
] as const satisfies readonly LinkItem[];

export type PageId = 'home' | 'about' | 'work' | 'life' | 'contact' | 'accessibility';

export interface PageMeta {
  id: PageId;
  path: string;
  /** `undefined` uses `site.defaultTitle`. */
  title: string | undefined;
  description: string;
}

export const pages: Record<PageId, PageMeta> = {
  home: {
    id: 'home',
    path: '/',
    title: undefined,
    description:
      'Hey, I’m Carson McRae: a technical program and product leader in Nashville who helps engineering teams ship complicated software, then goes home and builds more of it.',
  },
  about: {
    id: 'about',
    path: '/about/',
    title: 'About',
    description:
      'The longer version: where Carson McRae comes from, how he got into technology, and how he likes to work.',
  },
  work: {
    id: 'work',
    path: '/work/',
    title: 'Work',
    description:
      'Carson McRae’s work in technical program and product leadership at Booz Allen Hamilton, plus the software he builds on his own time.',
  },
  life: {
    id: 'life',
    path: '/life/',
    title: 'Outside work',
    description:
      'Nicole, two doodles named Margot and Quinn, and the hobbies that don’t fit on a resume.',
  },
  contact: {
    id: 'contact',
    path: '/contact/',
    title: 'Contact',
    description:
      'The best ways to reach Carson McRae: LinkedIn for professional conversations, GitHub for code, and his product portfolio for project details.',
  },
  accessibility: {
    id: 'accessibility',
    path: '/accessibility/',
    title: 'Accessibility',
    description:
      'How this site is built and tested to meet Section 508 and WCAG 2.2 AA, its known limitations, and how to report a problem.',
  },
};

export const contact = {
  title: 'Say hello.',
  lede: 'The easiest way to reach me is a message on LinkedIn. If it’s about code, GitHub works too.',
  topicsTitle: 'Good things to talk about',
  topics: [
    'Software delivery and technical program management',
    'Product ideas, side projects, and how they get built',
    'TTSNative, Recalen, or PicPledge',
    'Vanderbilt, Nashville, golf, or your latest PC build',
  ],
};

/** The "Get in touch" section that closes the homepage. */
export const homeContact = {
  title: 'Get in touch',
  body: 'The best way to reach me is a message on [LinkedIn](https://www.linkedin.com/in/carsonmcrae/). For code, I’m [carsonmcrae on GitHub](https://github.com/carsonmcrae), and the details behind my projects are in my [product portfolio](https://carsonmcrae.github.io/). There are a few [more ways to reach me](/contact/), too.',
};

export const footer = {
  signature: 'Built by Carson. Supervised by Margot and Quinn.',
  disclaimer: 'Views here are my own.',
};

export const notFound = {
  title: 'This page wandered off.',
  body: 'Error 404: I checked under the couch cushions. It isn’t there either.',
};

export const achievement = {
  title: 'Achievement unlocked: Completionist',
  body: 'You’ve visited every page on this site. That’s more than most people, and all of the dogs.',
};
