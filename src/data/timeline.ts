/**
 * Purpose: Approved posts for Carson’s Daysforth profile.
 * Scope: Confirmed public moments, photo albums, month-precise dates, and pinned milestones.
 * Constraints: Dates preserve their supplied precision; a photograph never supplies an event date.
 * Does NOT belong: Grouping, filtering, navigation, or rendering (src/lib/timeline-*).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { experiencePosts } from './timeline-experiences';
import { margotPhotos, quinnPhotos, weddingPhotos } from './photo-gallery';
export type Category = 'Work' | 'Projects' | 'Life';
export interface PostPhoto {
  name: string;
  imageKind?: 'photo' | 'screen';
  alt: string;
  caption: string;
  postId?: string;
}

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
  imageKind?: 'photo' | 'screen';
  gallery?: PostPhoto[];
  endDate?: string;
  project?: string;
  links?: { label: string; href: string }[];
}

export const timelineProfile = {
  handle: 'carsonmcrae',
  bio: 'I help teams build complicated things, then go home and build more things.',
  afterHours:
    'Booz Allen Hamilton by day; TTSNative, Recalen and PicPledge on nights and weekends.',
};

const corePosts: TimelinePost[] = [
  {
    id: 'born',
    date: '1999-11',
    title: 'Born',
    caption: 'The beginning.',
    body: [
      'No, I didn’t come out this big or with a full head of hair. I just like this picture better than a real baby photo. It also has my childhood best friend in it, who I miss every day.',
    ],
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
      'I built a Minecraft server called Minetrocity, working with developers. It was my first real taste of building something people could use.',
      'We had fully working minigames: Castle Siege, Pac-Man, and Temple Run. Mineplex later took inspiration from Minetrocity’s Castle Siege and the currency system in our lobby.',
    ],
    category: 'Projects',
    image: 'minetrocity-server',
    imageAlt: 'The Minetrocity Minecraft server lobby',
    links: [
      {
        label: 'Minetrocity on Planet Minecraft',
        href: 'https://www.planetminecraft.com/server/minetrocity/',
      },
    ],
  },
  {
    id: 'first-pc',
    date: '2015-12',
    title: 'First PC build',
    caption: 'It was not the last.',
    body: [
      'My first PC build, in December 2015. It was not the last, because gaming has been a pretty consistent part of my life.',
      'Roblox was my first game. From there it was mostly FPS games: H1Z1, CS:GO, PUBG, and Escape from Tarkov. Apparently spending hours choosing PC parts was the natural next step.',
    ],
    category: 'Life',
    image: 'my-first-built-pc-13',
    imageAlt: 'Carson’s first desktop PC build',
  },
  {
    id: 'started-vanderbilt',
    date: '2018-08',
    title: 'Started at Vanderbilt',
    caption: 'The beginning of my Vanderbilt chapter.',
    body: [
      'I started at Vanderbilt University in August 2018, studying Human & Organizational Development and Political Science.',
      'Over those four years I worked at [Apple](/posts/started-apple/) to help pay for college, served on the Student Alumni Board, and met lifelong friends. I also spent a semester at [UNSW in Sydney, Australia](/posts/sydney-study-abroad/).',
    ],
    category: 'Life',
    endDate: '2022-05',
    image: '2018-vanderblilt-carson',
    imageAlt: 'Carson on the Vanderbilt campus in 2018',
  },
  {
    id: 'infoworks',
    date: '2021-06',
    title: 'InfoWorks',
    caption: 'Consulting and business analysis.',
    body: [
      'I joined InfoWorks in June 2021 and stayed until September 2022, working in consulting and business analysis.',
      'It was about learning how organizations actually operate: listening to what people need and turning that into requirements a team can build. That experience became part of the foundation for my [work at Booz Allen](/posts/joined-booz-allen/).',
    ],
    category: 'Work',
    endDate: '2022-09',
    image: 'infoworks-headshot',
    imageAlt: 'Carson’s headshot when he joined InfoWorks',
  },
  {
    id: 'vanderbilt-graduation',
    date: '2022-05',
    title: 'Vanderbilt graduation',
    caption: 'Human & Organizational Development and Political Science.',
    body: [
      'I graduated from Vanderbilt University in May 2022, with studies in Human & Organizational Development and Political Science.',
      'Four years of working at [Apple](/posts/started-apple/) to help pay for college, the Student Alumni Board, [study abroad at UNSW in Australia](/posts/sydney-study-abroad/), and friends I’m keeping for life. A lot happened between move-in and this photo.',
    ],
    category: 'Work',
    milestone: true,
    pinned: true,
    image: '2022-carson-vandy-graduation',
    imageAlt: 'Carson in his graduation gown outside Warren College at Vanderbilt',
    gallery: [
      {
        name: '2022-vanderbilt-graduation',
        alt: 'Carson tossing his graduation cap at Vanderbilt',
        caption: 'Vanderbilt University · May 2022',
      },
    ],
  },
  {
    id: 'margot-arrives',
    date: '2022-07',
    title: 'Margot arrives',
    caption: 'A goldendoodle puppy with a very convincing shark impression.',
    body: [
      'Margot joined us in July 2022. She’s a goldendoodle, and as a puppy she was basically a shark with a very good publicist.',
      'These days she’s the sweetest dog. The puppy teeth were apparently just a phase.',
    ],
    category: 'Life',
    image: 'margot-puppy',
    imageAlt: 'Margot as a golden apricot puppy',
    gallery: margotPhotos,
  },
  {
    id: 'joined-booz-allen',
    date: '2022-09',
    title: 'Joined Booz Allen Hamilton',
    caption: 'Technical program and product leadership.',
    body: [
      'I joined Booz Allen Hamilton in September 2022. I support software delivery for the Department of Veterans Affairs, coordinating across multiple engineering teams.',
      'My work brings together technical program management and product leadership: planning releases, managing dependencies and technical risk, and keeping stakeholders aligned around what needs to ship.',
      'That includes supporting application modernization, APIs and integrations, production-issue response, and better engineering processes. I keep client specifics at work; [the Work page](/work/) has the public version. Views on this site are my own.',
    ],
    category: 'Work',
    image: 'bah-headshot',
    imageAlt: 'Carson’s Booz Allen Hamilton headshot with the Nashville skyline',
  },
  {
    id: 'quinn-arrives',
    date: '2023-07',
    title: 'Quinn arrives',
    caption: 'An Aussiedoodle, a Craigslist pickup, and an extremely good decision.',
    body: [
      'Quinn joined us in July 2023. She’s an Aussiedoodle, and she is the first and only thing I’ve ever found on Craigslist and gone to pick up. It still feels a little crazy that this is how I found her.',
      'She’s the smartest dog I’ve ever had and a huge softy. A very unexpected Craigslist success story.',
    ],
    category: 'Life',
    image: 'quinn-puppy',
    imageAlt: 'Quinn as a black puppy with white markings, on the grass',
    gallery: quinnPhotos,
  },
  {
    id: 'recalen-beta',
    date: '2026-07',
    title: 'Recalen private beta begins',
    caption:
      'Putting capture and recall into practice. Capture thoughts, links, files, and voice notes in one place, then find them with search, reminders, and calendar views.',
    body: [
      'Recalen is my capture-and-recall app for the things that are easy to lose track of: thoughts, links, files, and voice notes. Dump now. Recall later.',
      'Capture something quickly, then come back to it with organization, search, reminders, and calendar views across the web and native mobile apps. It entered an ongoing private beta in July 2026.',
    ],
    category: 'Projects',
    project: 'recalen',
    image: 'recalen-cover',
    imageKind: 'screen',
    imageAlt: 'Recalen branding and its capture feed with saved thoughts, folders, and reminders',
    gallery: [
      {
        name: 'recalen-interface',
        imageKind: 'screen',
        alt: 'The Recalen capture feed interface',
        caption: 'Recalen’s capture feed, with saved thoughts and reminders.',
      },
    ],
    links: [{ label: 'Recalen', href: 'https://recalen.com' }],
  },
  {
    id: 'ttsnative-1',
    date: '2026-10-19',
    title: 'TTSNative 1.0 released',
    caption:
      'Released as open source (MIT). A local text-to-speech reader for documents, with read-along highlighting and an optional, consent-based voice studio.',
    body: [
      'TTSNative is a free, open-source text-to-speech app that runs on your own computer. It reads PDFs, EPUBs, Word documents, and plain text aloud, with read-along highlighting to keep your place.',
      'The voice studio also supports optional voice cloning with consent. Your documents, voices, and generated audio stay on your machine.',
      'I designed and built the reader, voice studio, brand, and website end to end. Version 1.0.0 was released on October 19, 2026, under the MIT license.',
    ],
    category: 'Projects',
    project: 'ttsnative',
    image: 'ttsnative-interface',
    imageKind: 'screen',
    imageAlt: 'The TTSNative document reader interface',
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
    gallery: weddingPhotos,
  },
  {
    id: 'picpledge-wedding',
    date: '2026-10',
    title: 'PicPledge launched at the wedding',
    caption:
      'Shipped software at my own wedding. In my defense, it worked. A private event album where guests share photos as the day happens and download the pictures they want to keep.',
    body: [
      'PicPledge is a private photo-sharing app for events. Guests contribute to one shared album as the day happens, instead of the photos disappearing into everyone’s camera rolls.',
      'Guests can download the moments they want to keep, and optional facial matching helps people find photos of themselves. I built it for our wedding and launched it there in October 2026. Shipping software at my own wedding was apparently part of the plan.',
    ],
    category: 'Projects',
    project: 'picpledge',
    image: 'picpledge-interface',
    imageKind: 'screen',
    imageAlt: 'The PicPledge event photo gallery interface',
    links: [{ label: 'PicPledge', href: 'https://picpledge.com' }],
  },
  {
    id: 'built-daysforth',
    date: '2026-11',
    title: 'Built Daysforth',
    caption:
      'My own take on social media. You’re looking at the prototype. A timeline-first profile for work, projects, and life: switch to a photographic Posts view, filter by category, or save and react to moments.',
    body: [
      'A profile that is a timeline. Work, projects, and life, placed at the moments they happened. Built with Astro and hosted on GitHub Pages.',
    ],
    category: 'Projects',
    project: 'daysforth',
    image: 'daysforth-interface',
    imageKind: 'screen',
    imageAlt: 'The Daysforth profile with pinned photographs and the timeline controls',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/carsonmcrae/wcarsonmcrae' }],
  },
];
export const timelinePosts = [...corePosts, ...experiencePosts].toSorted((a, b) =>
  a.date.slice(0, 7).localeCompare(b.date.slice(0, 7)),
);
