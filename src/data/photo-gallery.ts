/**
 * Purpose: Approved albums and links from Life photographs to their timeline moments.
 * Scope: Distinct wedding photographs, puppy-to-grown-up albums, and hobby photographs.
 * Does NOT belong: Rendering, image processing, or unconfirmed dates.
 */
import type { PostPhoto } from './timeline';
export interface GalleryPhoto extends PostPhoto {
  postId: string;
}
export const weddingPhotos: GalleryPhoto[] = [
  {
    name: 'nicole-carson-1',
    alt: 'Nicole and Carson inside on their wedding day',
    caption: 'October 2026',
    postId: 'married-nicole',
  },
  {
    name: 'carson-friends',
    alt: 'Carson with friends at the wedding',
    caption: 'With friends · October 2026',
    postId: 'married-nicole',
  },
];
export const margotPhotos: GalleryPhoto[] = [
  {
    name: 'margot-1',
    alt: 'Margot, a golden apricot doodle',
    caption: 'Margot, a little more grown up',
    postId: 'margot-arrives',
  },
  {
    name: 'margot-2',
    alt: 'Another photograph of Margot',
    caption: 'Margot',
    postId: 'margot-arrives',
  },
];
export const quinnPhotos: GalleryPhoto[] = [
  {
    name: 'quinn-1',
    alt: 'Quinn, a black doodle with white markings',
    caption: 'Quinn, a little more grown up',
    postId: 'quinn-arrives',
  },
  {
    name: 'quinn-2',
    alt: 'Another photograph of Quinn',
    caption: 'Quinn',
    postId: 'quinn-arrives',
  },
];
export const dogPhotos: GalleryPhoto[] = [margotPhotos[1]!, quinnPhotos[1]!];
export const lifePhotos: GalleryPhoto[] = [
  {
    name: 'carson-golf-brother',
    alt: 'Carson and his brother playing golf',
    caption: 'Golf · Since August 2026',
    postId: 'started-golf',
  },
  {
    name: 'carson-pickleball',
    alt: 'Carson playing pickleball',
    caption: 'Pickleball · Since May 2026',
    postId: 'started-pickleball',
  },
  {
    name: 'watch-first-fossil',
    alt: 'Carson’s first Fossil Grant Chronograph',
    caption: 'Watches · Since September 2012',
    postId: 'watch-collecting',
  },
  {
    name: 'australia-study-abroad',
    alt: 'Carson outside the Sydney Opera House',
    caption: 'Sydney · August 2019',
    postId: 'sydney-study-abroad',
  },
];
