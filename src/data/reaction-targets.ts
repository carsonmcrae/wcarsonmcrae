/**
 * Purpose: Limit shared reactions to approved permanent moments and image identities.
 * Scope: Pure content-derived target IDs and their four supported wire keys, including retired moments.
 * Constraints: Published identities must stay accepted when their presentation changes or is retired.
 * Does NOT belong: Asset imports, browser controllers, deployment bindings, or database writes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { timelinePosts } from './timeline';
import { postAliases } from './post-aliases';
import { carsonGallery, dogGalleries, lifePhotos } from './photo-gallery';
import { dogs } from './life';
import { aboutPortrait, profile } from './profile';
import { photoReactionId } from '../lib/photo-reaction-id';
import { reactionKeys } from '../lib/reaction-keys';

const galleryPhotos = [
  ...timelinePosts.flatMap((post) => post.gallery ?? []),
  ...carsonGallery.photos,
  ...dogGalleries.flatMap((gallery) => gallery.photos),
  ...lifePhotos,
];
const imageIds = [
  ...timelinePosts
    .filter((post) => post.image)
    .map((post) => photoReactionId(post.image!, post.imageKind)),
  ...galleryPhotos.map((photo) => photoReactionId(photo.name, photo.imageKind)),
  ...dogs.map((dog) => photoReactionId(dog.photo)),
  photoReactionId(profile.portrait),
  photoReactionId(aboutPortrait),
];
export const supportedReactionIds = [
  ...new Set([...timelinePosts.map((post) => post.id), ...Object.keys(postAliases), ...imageIds]),
];
export const supportedReactionKeys = reactionKeys(supportedReactionIds);
