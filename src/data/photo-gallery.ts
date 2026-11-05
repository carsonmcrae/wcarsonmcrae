/**
 * Purpose: Approved albums and links from Life photographs to their timeline moments.
 * Scope: Distinct wedding photographs, dog albums, Carson’s gallery, and hobby photographs.
 * Does NOT belong: Rendering, image processing, or unconfirmed dates.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { PostPhoto } from './timeline';
import { galleryPhotos } from '../lib/content-records';
export interface GalleryPhoto extends PostPhoto {
  postId?: string;
}
export const weddingPhotos = galleryPhotos({
  weddingInside: [
    'nicole-carson-1',
    'Nicole and Carson inside on their wedding day',
    'October 2026',
    'married-nicole',
  ],
  withFriends: [
    'carson-friends',
    'Carson with friends at the wedding',
    'With friends · October 2026',
    'married-nicole',
  ],
});
export const margotPhotos = galleryPhotos({
  grownMargot: [
    'margot-1',
    'Margot, a golden apricot doodle',
    'Margot, a little more grown up',
    'margot-arrives',
  ],
  margotGlasses: [
    'margot-2',
    'Margot wearing glasses and a dark bow tie',
    'The glasses and bow tie',
    'margot-arrives',
  ],
});
export const quinnPhotos = galleryPhotos({
  grownQuinn: [
    'quinn-1',
    'Quinn, a black doodle with white markings',
    'Quinn, a little more grown up',
    'quinn-arrives',
  ],
  quinnAtHome: ['quinn-2', 'Quinn sitting indoors with her mouth open', 'At home', 'quinn-arrives'],
});
export const dogGalleries = [
  {
    id: 'margot-gallery',
    title: 'More of Margot',
    photos: [
      margotPhotos[1]!,
      ...galleryPhotos({
        gardenSwing: [
          'margot-gallery-1',
          'Carson holding Margot as a puppy on a garden swing',
          'On the garden swing',
        ],
        snowAtNight: [
          'margot-gallery-2',
          'Margot sitting in the snow at night',
          'A snow day, after dark',
        ],
        christmasTree: [
          'margot-gallery-3',
          'Margot in front of a decorated Christmas tree',
          'By the Christmas tree',
        ],
        rockView: [
          'margot-gallery-4',
          'Carson and Margot sitting on a rock above a wooded landscape',
          'Taking in the view',
        ],
        garden: [
          'margot-gallery-5',
          'Margot sitting in the garden with her tongue out',
          'In the garden',
        ],
        fireplaceDecoration: [
          'margot-gallery-6',
          'Margot touching noses with a dog decoration beside the fireplace',
          'Meeting the decorations',
        ],
      }),
    ],
  },
  {
    id: 'quinn-gallery',
    title: 'More of Quinn',
    photos: [
      quinnPhotos[1]!,
      ...galleryPhotos({
        bed: [
          'quinn-gallery-1',
          'Quinn resting on a bed, with Margot behind her',
          'Together at home',
        ],
        autumnLeaves: [
          'quinn-gallery-2',
          'Quinn and Margot standing in autumn leaves',
          'Out in the leaves',
        ],
        snow: ['quinn-gallery-3', 'Quinn standing in the snow beside a wooden post', 'In the snow'],
        patio: ['quinn-gallery-4', 'Quinn lying in the grass near a patio', 'A spot in the shade'],
        grass: [
          'quinn-gallery-5',
          'Quinn lying in green grass with her tongue out',
          'In the grass',
        ],
        sofa: [
          'quinn-gallery-6',
          'Quinn resting her head on the edge of a sofa',
          'At home on the sofa',
        ],
      }),
    ],
  },
];
export const carsonGallery = {
  title: 'A few more photos',
  photos: galleryPhotos({
    danceFloor: [
      'carson-gallery-1',
      'Wedding guests gathered on a dance floor with their arms raised',
      'On the dance floor',
    ],
    baseball: [
      'carson-gallery-2',
      'Carson in the stands at a baseball game at night',
      'At the ballpark',
    ],
    pool: ['carson-gallery-3', 'Carson lining up a shot at a pool table', 'A game of pool'],
    beach: ['carson-gallery-4', 'Carson and Nicole on a beach at sunset', 'On the beach'],
    frontSteps: [
      'carson-gallery-5',
      'A black-and-white photograph of Carson on front steps with Margot and Quinn',
      'On the front steps',
    ],
    soccer: [
      'carson-gallery-6',
      'Carson with two people in the stands at a soccer match',
      'At the match',
    ],
    withDogs: [
      'carson-gallery-7',
      'Carson and another person sitting together with dogs',
      'With the dogs',
    ],
    groupOutside: [
      'carson-gallery-8',
      'Carson with three people and a dog outside a brick building',
      'Together outside',
    ],
  }),
};
export const lifePhotos = galleryPhotos({
  golf: [
    'carson-golf-brother',
    'Carson and his brother playing golf',
    'Golf · Since August 2026',
    'started-golf',
  ],
  pickleball: [
    'carson-pickleball',
    'Carson playing pickleball',
    'Pickleball · Since May 2026',
    'started-pickleball',
  ],
  firstWatch: [
    'first-watch-new-photo',
    'Carson’s first Fossil Grant Chronograph',
    'Watches · Since September 2012',
    'watch-collecting',
  ],
  sydney: [
    'australia-study-abroad',
    'Carson outside the Sydney Opera House',
    'Sydney · August 2019',
    'sydney-study-abroad',
  ],
});
