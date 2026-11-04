/**
 * Purpose: The personal side of the site.
 * Scope: Copy about Nicole, Margot, and Quinn, the household org chart, interests, the homepage's
 *   "Off the clock" section, and the dated "Right now" list.
 * Constraints: Only details Carson approved. Never invent stories, quotes, or traits for Nicole or
 *   the dogs; family photos need approval before they are added.
 * Does NOT belong: Professional content (src/data/career.ts and src/data/profile.ts).
 */
import type { Dog, Interest, NowItem } from './types';

export const lifeIntro = {
  title: 'Outside work, it’s family, two doodles, and a long list of hobbies.',
  lede: 'The parts that don’t fit on a resume. Fair warning: there are dogs.',
};

/** The "Off the clock" section on the homepage. Hobbies link to their entries on /life/. */
export const homeTeaser = {
  title: 'Off the clock',
  body: [
    'At home it’s Nicole, my wife, and two doodles named [Margot and Quinn](/life/#dogs) who are fairly sure they run the place.',
    'When I’m not building something, I’m probably [gaming](/life/#games), [working on a PC](/life/#pc-building), [on a golf course](/life/#golf), or reading about [watches](/life/#watches) I don’t need.',
  ],
};

export const nicole = {
  title: 'Nicole',
  body: [
    'Nicole is my wife. We got married in October 2026, and our wedding doubled as the launch of [PicPledge](/work/#picpledge), the photo-sharing app I built so our guests could share photos as the day happened.',
    'Yes, I shipped software at my own wedding. In my defense, it worked.',
  ],
  // Optional: an approved photo at src/assets/photos/nicole-and-carson.jpg. Nothing shows until then.
  photo: 'nicole-carson-2',
  photoAlt: 'Nicole and Carson',
};

export const dogsIntro = {
  title: 'Margot and Quinn',
  lede: 'Two doodles, one household, zero elections.',
};

export const dogs: Dog[] = [
  {
    name: 'Margot',
    breed: 'Doodle',
    coat: 'Golden apricot, wavy',
    title: 'Co-CEO (self-appointed)',
    detail: 'One half of the household’s management team. Nobody voted on this.',
    photo: 'margot-1',
    photoAlt: 'Margot, a golden apricot doodle with a wavy coat',
    swatch: 'margot',
  },
  {
    name: 'Quinn',
    breed: 'Doodle',
    coat: 'Black and shaggy, with white markings',
    title: 'Co-CEO (also self-appointed)',
    detail: 'The other half of management. Also unelected.',
    photo: 'quinn-1',
    photoAlt: 'Quinn, a black doodle with a shaggy coat and white markings',
    swatch: 'quinn',
  },
];

export const orgChart = {
  title: 'Household org chart, as understood by the dogs',
  management: ['Margot', 'Quinn'],
  staff: ['Nicole', 'Carson'],
  staffDuties: 'walks, meals, and door operations',
};

export const interestsIntro = {
  title: 'Things I’m into',
  lede: 'The common thread: I like understanding how things work. If it has an inside, I’d like to see it.',
};

export const interests: Interest[] = [
  {
    id: 'games',
    name: 'Video games',
    detail:
      'Long-time gamer. My first real taste of building something was a Minecraft server at 13, so games get partial credit for my career.',
  },
  {
    id: 'pc-building',
    name: 'PC building',
    detail:
      'First build in 2015. I still enjoy picking parts, routing cables, and figuring out why something won’t boot.',
  },
  {
    id: 'golf',
    name: 'Golf',
    detail:
      'A sport that rewards patience and punishes overconfidence. Good practice for release planning.',
  },
  {
    id: 'watches',
    name: 'Watches',
    detail:
      'Small machines that do one thing extremely well, built to last for decades. Hard not to respect that.',
  },
  {
    id: 'travel',
    name: 'Travel',
    detail: 'Seeing new places, and how differently the same things can work somewhere else.',
  },
  {
    id: 'experiments',
    name: 'Software experiments',
    detail:
      'AI, automation, and whatever I’m curious about that week. Most experiments stay small. A few turn into [products](/work/#projects).',
  },
  {
    id: 'fantasy-football',
    name: 'Fantasy football',
    detail: 'Where my program management skills meet weekly humbling.',
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    detail: 'Golf’s faster, louder, and more forgiving cousin.',
  },
];

export const now = {
  title: 'Right now',
  updated: 'November 2026',
  items: [
    {
      label: 'Building',
      value: '[Recalen](https://carsonmcrae.github.io/recalen/), in an ongoing private beta',
    },
    {
      label: 'Maintaining',
      value: '[TTSNative](https://ttsnative.com), the open-source text-to-speech app',
    },
    { label: 'Recently', value: 'Got married (October 2026)' },
    { label: 'Home base', value: 'Nashville, with Nicole, Margot, and Quinn' },
  ] satisfies NowItem[],
};
