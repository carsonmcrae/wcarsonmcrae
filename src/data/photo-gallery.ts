/**
 * Purpose: Places the remaining approved photographs on Carson’s secondary pages.
 * Scope: Photo names, useful alternatives, and captions using only confirmed dates and subjects.
 * Does NOT belong: Image optimization or gallery layout.
 */
export interface GalleryPhoto {
  name: string;
  alt: string;
  caption: string;
}
export const weddingPhotos: GalleryPhoto[] = [
  {
    name: 'nicole-carson-1',
    alt: 'Nicole and Carson together inside on their wedding day',
    caption: 'October 2026',
  },
  {
    name: 'nicole-carson-b-w-1',
    alt: 'A black-and-white wedding photograph of Nicole and Carson',
    caption: 'October 2026',
  },
  {
    name: 'nicole-carson-b-w-2',
    alt: 'Nicole and Carson in a second black-and-white wedding photograph',
    caption: 'October 2026',
  },
];
export const dogPhotos: GalleryPhoto[] = [
  {
    name: 'margot-2',
    alt: 'Another photograph of Margot, a golden apricot doodle',
    caption: 'Margot',
  },
  {
    name: 'quinn-2',
    alt: 'Another photograph of Quinn, a black doodle with white markings',
    caption: 'Quinn',
  },
];
export const lifePhotos: GalleryPhoto[] = [
  {
    name: 'carson-golf-brother',
    alt: 'Carson and his brother playing golf',
    caption: 'Golf · Since August 2026',
  },
  {
    name: 'carson-pickleball',
    alt: 'Carson playing pickleball',
    caption: 'Pickleball · Since May 2026',
  },
  { name: 'hamilton-murph-watch', alt: 'A Hamilton Murph watch', caption: 'Watches · Since 2025' },
  { name: 'carson-friends', alt: 'Carson spending time with friends', caption: 'With friends' },
];
