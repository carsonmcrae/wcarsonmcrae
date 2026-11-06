/**
 * Purpose: Approved albums and links from Life photographs to their timeline moments.
 * Scope: Distinct wedding and family photographs, dog albums, Carson’s gallery, and hobbies.
 * Does NOT belong: Rendering, image processing, or unconfirmed dates.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { PostPhoto } from './timeline';
import { galleryPhotos } from '../lib/content-records';
export interface GalleryPhoto extends PostPhoto {
  postId?: string;
}
export const familyPhotos = galleryPhotos({
  carsonsFamily: [
    'me-my-family',
    'Nicole and Carson with Carson’s family at their outdoor wedding ceremony',
    'The family I’ve had by my side my whole life, together on our wedding day.',
    'married-nicole',
  ],
  nicolesFamily: [
    'me-nicoles-family',
    'Nicole and Carson with Nicole’s family at their outdoor wedding ceremony',
    'My new family, together on our wedding day.',
    'married-nicole',
  ],
});
export const weddingPhotos = [
  ...galleryPhotos({
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
  }),
  ...familyPhotos,
];
export const margotPhotos = galleryPhotos({
  grownMargot: [
    'margot-1',
    'Margot sitting beside a bed with a yellow duck toy on her head',
    'Margot, feeling silly.',
    'margot-arrives',
  ],
  margotGlasses: [
    'margot-2',
    'Margot wearing glasses on a gray sofa',
    'A reminder that Margot is management.',
    'margot-arrives',
  ],
});
export const quinnPhotos = galleryPhotos({
  grownQuinn: [
    'quinn-1',
    'Quinn wearing glasses on a gray sofa, with white markings on her chest and paws',
    'The less serious of our two managers.',
    'quinn-arrives',
  ],
  quinnAtHome: [
    'quinn-2',
    'Quinn smiling beside a gray loveseat after a short haircut',
    'Still smiling after a haircut that went a little too short.',
    'quinn-arrives',
  ],
});
export const dogGalleries = [
  {
    id: 'margot-gallery',
    title: 'More of Margot',
    photos: [
      margotPhotos[0]!,
      margotPhotos[1]!,
      ...galleryPhotos({
        gardenSwing: [
          'margot-gallery-1',
          'Carson holding Margot as a puppy on a garden swing',
          'Margot’s first photoshoot. She looked so much like a golden retriever puppy.',
        ],
        snowAtNight: [
          'margot-gallery-2',
          'Margot sitting in the snow at night',
          'Her first time seeing snow.',
        ],
        christmasTree: [
          'margot-gallery-3',
          'Margot in front of a decorated Christmas tree',
          'Margot’s first Christmas.',
        ],
        rockView: [
          'margot-gallery-4',
          'Carson and Margot sitting on a rock above a wooded landscape',
          'Margot likes an adventure. We’ve taken her on a few hikes; she even learned to swim on one.',
        ],
        garden: [
          'margot-gallery-5',
          'Margot posing on the lawn with her wavy golden coat and tongue out',
          'Very good at posing, with a beautiful wavy coat to show off.',
        ],
        fireplaceDecoration: [
          'margot-gallery-6',
          'Margot touching noses with a dog decoration beside the fireplace',
          'Worried I’d brought home another dog like Quinn. Luckily, this one was just a Christmas decoration.',
        ],
      }),
    ],
  },
  {
    id: 'quinn-gallery',
    title: 'More of Quinn',
    photos: [
      quinnPhotos[0]!,
      quinnPhotos[1]!,
      ...galleryPhotos({
        bed: [
          'quinn-gallery-1',
          'Quinn looking at the camera on a bed, with Margot asleep behind her',
          'I knew she’d be trouble after seeing that cute face.',
        ],
        autumnLeaves: [
          'quinn-gallery-2',
          'Quinn and Margot standing in autumn leaves',
          'The longest her hair got before her one-year haircut, when we said goodbye to the puppy fur.',
        ],
        snow: [
          'quinn-gallery-3',
          'Quinn standing in deep snow beside a wooden post',
          'Quinn’s first snow was a big one. She was very excited.',
        ],
        patio: [
          'quinn-gallery-4',
          'Quinn lying on the grass outside her first home',
          'Her first home, and the only one she knew for two years.',
        ],
        grass: [
          'quinn-gallery-5',
          'Quinn lying in green grass with her tongue out',
          'Cooling down after running around the grass at Belmont.',
        ],
        sofa: [
          'quinn-gallery-6',
          'Quinn looking up with her head on the edge of a gray sofa',
          'A master of baby eyes when she wants something.',
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
      'The end of our wedding was a hit. And yes, that is actually a cup of water. Literally. I’m not joking.',
      'married-nicole',
    ],
    baseball: [
      'carson-gallery-2',
      'Carson in the stands at a baseball game at night',
      'At the Padres–Yankees game in San Diego.',
    ],
    pool: [
      'carson-gallery-3',
      'Carson lining up a shot at a pool table in Charleston',
      'Playing pool in Charleston.',
    ],
    beach: [
      'carson-gallery-4',
      'Carson and Nicole on a beach at sunset in Naples, Florida',
      'Our first real trip together, to Naples, Florida.',
    ],
    frontSteps: [
      'carson-gallery-5',
      'A black-and-white photograph of Carson on front steps with Margot and Quinn',
      'One of my favorite pictures with my two best girls.',
    ],
    soccer: [
      'carson-gallery-6',
      'Carson with friends in the stands at a Nashville SC soccer game',
      'With friends at a Nashville SC game—the first time I saw Messi play in person. It was his first game in Nashville after joining the league.',
    ],
    gamingWithJackson: [
      'carson-gallery-7',
      'Carson and Jackson playing video games on a couch, with Margot and Quinn beside them',
      'Playing video games with Jackson, just like old times.',
    ],
    groupOutside: [
      'carson-gallery-8',
      'Carson with his family and a dog outside a brick building in St. Augustine',
      'In St. Augustine with my family, on our first family trip in a long time.',
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
