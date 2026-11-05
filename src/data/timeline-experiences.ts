/**
 * Purpose: Carson’s newly confirmed work, travel, and hobby moments.
 * Scope: Supplied dates, actual photographs, watch identities, and approved video links.
 * Does NOT belong: Date inference from photographs or rendering and navigation.
 */
import type { TimelinePost } from './timeline';
export const experiencePosts: TimelinePost[] = [
  {
    id: 'high-school-graduation',
    date: '2018-05',
    title: 'High school salutatorian',
    category: 'Life',
    milestone: true,
    caption: 'Graduation day · May 2018.',
    body: ['I graduated from high school as salutatorian in May 2018.'],
    image: 'may-2018-highschool-grad',
    imageAlt: 'Carson at his high-school graduation in May 2018',
  },
  {
    id: 'eagle-scout',
    date: '2016-10',
    title: 'Became an Eagle Scout',
    category: 'Life',
    milestone: true,
    caption: 'Board of review passed. Eagle Scout earned.',
    body: [
      'I became an Eagle Scout in October 2016 after passing my board of review.',
      'For my Eagle project, I cleared a wooded area by a river where a dog park was being installed, and raised $1,500 for a concrete slab and bench installation.',
    ],
    image: 'eagle-scout-october-2016',
    imageAlt: 'Carson after earning Eagle Scout in October 2016',
    gallery: [
      {
        name: 'eaglescout-family',
        alt: 'Carson with his family celebrating Eagle Scout',
        caption: 'Celebrating with family · October 2016',
      },
      {
        name: 'eagle-project',
        alt: 'The site of Carson’s Eagle Scout service project by the river',
        caption:
          'My Eagle project · Clearing the site and raising $1,500 for a concrete slab and bench',
      },
    ],
  },
  {
    id: 'fbla-video-awards',
    date: '2017-07',
    title: 'First in Tennessee. Sixth nationally',
    category: 'Life',
    milestone: true,
    caption: 'FBLA Digital Video Production · July 2017.',
    body: [
      'In July 2017, I won first place in Tennessee and sixth place nationally in the FBLA Digital Video Production competition. This is the video from that competition.',
    ],
    image: 'fbla-first-place-state',
    imageAlt: 'Carson’s first-place Tennessee FBLA award',
    gallery: [
      {
        name: 'fbla-6th-nationals',
        alt: 'Carson at the FBLA national competition',
        caption: 'Sixth place nationally · July 2017',
      },
      {
        name: 'fbla-6th-nationals-trophy-2017',
        alt: 'The sixth-place national FBLA Digital Video Production trophy',
        caption: 'FBLA Digital Video Production · Sixth-place national trophy, 2017',
      },
    ],
    links: [
      {
        label: 'Watch the FBLA competition video',
        href: 'https://www.youtube.com/watch?v=bIE0WIO9Qds',
      },
    ],
  },
  {
    id: 'watch-collecting',
    date: '2012-09',
    title: 'The first watch of many',
    category: 'Life',
    caption: 'A Fossil in September 2012 started something.',
    body: [
      'I got my first watch, a Fossil Men’s Grant Chronograph, in September 2012, and I’ve been collecting ever since. These are some of my featured watches.',
      'The collection includes a Lorier Zephyr, Traska Venturer GMT, Tissot Le Locle Powermatic 80, and Hamilton Murph. I even started making watches myself: the green-dial GMT is one I built.',
      'Yes, I mispronounced Tissot in the review. It was supposed to be engagement bait. The engagement apparently declined the invitation.',
    ],
    image: 'watch-first-fossil',
    imageAlt: 'Fossil Men’s Grant Chronograph, Carson’s first watch',
    gallery: [
      { name: 'watch-lorier', alt: 'A Lorier Zephyr with a red dial', caption: 'Lorier Zephyr' },
      { name: 'watch-traska', alt: 'Carson’s Traska Venturer GMT', caption: 'Traska Venturer GMT' },
      {
        name: 'watch-tissot',
        alt: 'A Tissot Le Locle Powermatic 80 with a black dial',
        caption: 'Tissot Le Locle Powermatic 80',
      },
      {
        name: 'hamilton-murph-watch',
        alt: 'Carson’s Hamilton Murph watch',
        caption: 'Hamilton Murph',
      },
      {
        name: 'watch-i-made',
        alt: 'The green-dial GMT watch Carson built',
        caption: 'Green-dial GMT · Built by me',
      },
    ],
    links: [
      {
        label: 'Watch my Tissot review on YouTube',
        href: 'https://www.youtube.com/watch?v=nG5-vbzzx2o',
      },
    ],
  },
  {
    id: 'started-apple',
    date: '2018-07',
    endDate: '2022-05',
    title: 'Started at Apple',
    category: 'Work',
    caption: 'July 2018 – May 2022.',
    body: ['I started working at Apple in July 2018 and stayed until May 2022.'],
    image: 'carson-apple-work',
    imageAlt: 'Carson wearing his Apple shirt',
  },
  {
    id: 'sydney-study-abroad',
    date: '2019-08',
    title: 'A semester in Sydney',
    category: 'Life',
    caption: 'UNSW, Apple, and a camera in Australia.',
    body: [
      'In August 2019, I studied abroad in Sydney, Australia, at UNSW. While there, I worked at Apple and was a videographer for IFSA-Butler.',
    ],
    image: 'australia-study-abroad',
    imageAlt: 'Carson outside the Sydney Opera House during study abroad',
    links: [
      { label: 'Watch my study-abroad video', href: 'https://www.youtube.com/watch?v=WKr8NrbeB9Q' },
    ],
  },
  {
    id: 'youtube-experiment',
    date: '2019-10',
    title: 'My brief YouTube era',
    category: 'Life',
    caption: 'The creator career did not quite take off.',
    body: [
      'In October 2019, I tried to become a YouTuber. It never really panned out, but the study-abroad video is still there.',
    ],
    image: 'youtube-post-photo',
    imageAlt: 'Carson sitting outside at night in Sydney',
    links: [
      {
        label: 'Watch my study-abroad video on YouTube',
        href: 'https://www.youtube.com/watch?v=WKr8NrbeB9Q',
      },
    ],
  },
  {
    id: 'made-a-watch',
    date: '2024-12',
    title: 'Built a watch of my own',
    category: 'Life',
    caption: 'Collecting them eventually turned into making one.',
    body: [
      'In December 2024, I built this green-dial GMT watch myself. A new way to spend far too long looking at small parts.',
    ],
    image: 'watch-i-made',
    imageAlt: 'The custom green-dial GMT watch Carson built',
  },
  {
    id: 'started-pickleball',
    date: '2026-05',
    title: 'Picked up pickleball',
    category: 'Life',
    caption: 'Golf’s faster, louder, and more forgiving cousin.',
    body: ['I started playing pickleball in May 2026.'],
    image: 'carson-pickleball',
    imageAlt: 'Carson playing pickleball',
  },
  {
    id: 'started-golf',
    date: '2026-08',
    title: 'Started playing golf',
    category: 'Life',
    caption: 'Good practice for patience. Less good for overconfidence.',
    body: ['I started playing golf in August 2026.'],
    image: 'carson-golf-brother',
    imageAlt: 'Carson and his brother on a golf course',
  },
];
