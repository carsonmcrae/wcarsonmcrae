/**
 * Purpose: Approved posts for Carson’s Daysforth profile.
 * Scope: Seventeen confirmed public moments, month-precise dates, and pinned milestones.
 * Constraints: Dates preserve their supplied precision; a photograph never supplies an event date.
 * Does NOT belong: Grouping, filtering, navigation, or rendering (src/lib/timeline-*).
 */
export type Category = 'Work' | 'Projects' | 'Life';

export interface TimelinePost {
  id: string;
  date: string;
  title: string;
  caption: string;
  body: string[];
  category: Category;
  milestone?: boolean;
  pinned?: boolean;
  image?: string;
  imageAlt?: string;
  project?: string;
  links?: { label: string; href: string }[];
}

export const timelineProfile = {
  handle: 'carsonmcrae',
  bio: 'I help teams build complicated things, then go home and build more things.',
  afterHours:
    'Booz Allen Hamilton by day; TTSNative, Recalen and PicPledge on nights and weekends.',
};

export const timelinePosts: TimelinePost[] = [
  {
    id: 'born',
    date: '1999-11',
    title: 'Born',
    caption: 'The beginning.',
    body: [],
    category: 'Life',
    milestone: true,
    pinned: true,
    image: '1999-born',
    imageAlt: 'A childhood photograph of Carson sitting with a dog',
  },
  {
    id: 'minetrocity',
    date: '2014-02-22',
    title: 'Built Minetrocity',
    caption: 'A Minecraft server, and my first real taste of building something.',
    body: [
      'I built a Minecraft server called Minetrocity, working with developers. It caught the attention of the creators of Mineplex.',
    ],
    category: 'Projects',
  },
  {
    id: 'first-pc',
    date: '2015-12',
    title: 'First PC build',
    caption: 'It was not the last.',
    body: ['My first PC build, in December 2015.'],
    category: 'Life',
    image: 'my-first-built-pc-13',
    imageAlt: 'Carson’s first desktop PC build',
  },
  {
    id: 'started-vanderbilt',
    date: '2018-08',
    title: 'Started at Vanderbilt',
    caption: 'The beginning of my Vanderbilt chapter.',
    body: ['Started at Vanderbilt University in August 2018.'],
    category: 'Life',
  },
  {
    id: 'infoworks',
    date: '2021-06',
    title: 'InfoWorks',
    caption: 'Consulting and business analysis.',
    body: ['Joined InfoWorks in June 2021, working in consulting and business analysis.'],
    category: 'Work',
  },
  {
    id: 'vanderbilt-graduation',
    date: '2022-05',
    title: 'Vanderbilt graduation',
    caption: 'Human & Organizational Development and Political Science.',
    body: ['Graduated from Vanderbilt University, Class of 2022.'],
    category: 'Work',
    milestone: true,
    pinned: true,
    image: '2022-vanderbilt-graduation',
    imageAlt: 'Carson in a graduation gown, tossing his cap outside Warren College at Vanderbilt',
  },
  {
    id: 'margot-arrives',
    date: '2022-07',
    title: 'Margot arrives',
    caption: 'A golden apricot doodle joins the household.',
    body: [],
    category: 'Life',
    image: 'margot-1',
    imageAlt: 'Margot, a golden apricot doodle',
  },
  {
    id: 'joined-booz-allen',
    date: '2022-09',
    title: 'Joined Booz Allen Hamilton',
    caption: 'Technical program and product leadership.',
    body: [
      'Supporting software delivery for the Department of Veterans Affairs. Views on this site are my own.',
    ],
    category: 'Work',
  },
  {
    id: 'quinn-arrives',
    date: '2023-07',
    title: 'Quinn arrives',
    caption: 'A black doodle with white markings joins the household.',
    body: [],
    category: 'Life',
    image: 'quinn-1',
    imageAlt: 'Quinn, a black doodle with white markings',
  },
  {
    id: 'ttsnative-started',
    date: '2026-03-24',
    title: 'Started building TTSNative',
    caption: 'Text-to-speech that runs on your own computer.',
    body: [
      'The first commit of TTSNative, an app for reading documents aloud while keeping documents, voices, and audio on your computer.',
    ],
    category: 'Projects',
    project: 'ttsnative',
    links: [{ label: 'TTSNative', href: 'https://ttsnative.com' }],
  },
  {
    id: 'recalen-started',
    date: '2026-04',
    title: 'Started building Recalen',
    caption: 'Dump now. Recall later.',
    body: [
      'A capture-and-recall app for thoughts, links, files, and voice notes, with organization, search, reminders, and calendar views.',
    ],
    category: 'Projects',
    project: 'recalen',
    links: [{ label: 'Recalen', href: 'https://recalen.com' }],
  },
  {
    id: 'recalen-beta',
    date: '2026-07',
    title: 'Recalen private beta begins',
    caption: 'Putting capture and recall into practice.',
    body: ['Recalen entered its private beta in July 2026.'],
    category: 'Projects',
    project: 'recalen',
    links: [{ label: 'Recalen', href: 'https://recalen.com' }],
  },
  {
    id: 'picpledge-started',
    date: '2026-09-17',
    title: 'Started building PicPledge',
    caption: 'Private photo sharing for events.',
    body: ['Guests add photos to a shared album and download the moments they want to keep.'],
    category: 'Projects',
    project: 'picpledge',
    links: [{ label: 'PicPledge', href: 'https://picpledge.com' }],
  },
  {
    id: 'ttsnative-1',
    date: '2026-10-19',
    title: 'TTSNative 1.0 released',
    caption: 'Released as open source (MIT).',
    body: [
      'TTSNative 1.0.0 was released publicly on October 19, 2026. It reads PDFs, EPUBs, Word documents, and plain text aloud, with read-along highlighting.',
    ],
    category: 'Projects',
    project: 'ttsnative',
    links: [
      { label: 'TTSNative', href: 'https://ttsnative.com' },
      { label: 'Source on GitHub', href: 'https://github.com/carsonmcrae/ttsnative' },
    ],
  },
  {
    id: 'married-nicole',
    date: '2026-10',
    title: 'Married Nicole',
    caption: '',
    body: [
      'Nicole and I got married in October 2026. Our wedding also became the launch of PicPledge.',
    ],
    category: 'Life',
    milestone: true,
    pinned: true,
    image: 'nicole-carson-2',
    imageAlt: 'Nicole and Carson together on their wedding day',
  },
  {
    id: 'picpledge-wedding',
    date: '2026-10',
    title: 'PicPledge launched at the wedding',
    caption: 'Shipped software at my own wedding. In my defense, it worked.',
    body: ['I built PicPledge so our wedding guests could share photos as the day happened.'],
    category: 'Projects',
    project: 'picpledge',
    links: [{ label: 'PicPledge', href: 'https://picpledge.com' }],
  },
  {
    id: 'built-daysforth',
    date: '2026-11',
    title: 'Built Daysforth',
    caption: 'My own take on social media. You’re looking at the prototype.',
    body: [
      'A profile that is a timeline. Work, projects, and life, placed at the moments they happened. Built with Astro and hosted on GitHub Pages.',
    ],
    category: 'Projects',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/carsonmcrae/wcarsonmcrae' }],
  },
];
