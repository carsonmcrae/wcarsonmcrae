/**
 * Purpose: Expand compact, labelled content records into the site’s typed display models.
 * Scope: Gallery photo fields and project identity, copy, stack, and link records.
 * Does NOT belong: Personal facts, content approval, rendering, or network behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { GalleryPhoto } from '../data/photo-gallery';
import type { Project } from '../data/types';

type PhotoRecord = readonly [name: string, alt: string, caption: string, postId?: string];
interface ProjectRecord {
  identity: readonly [postId: string, name: string, status: Project['status']];
  copy: readonly [tagline: string, description: string, note: string];
  stack: string[];
  links: readonly (readonly [label: string, href: string])[];
}

export function galleryPhotos(records: Record<string, PhotoRecord>): GalleryPhoto[] {
  return Object.values(records).map(([name, alt, caption, postId]) => ({
    name,
    alt,
    caption,
    ...(postId ? { postId } : {}),
  }));
}

export function projectRecords(records: Record<string, ProjectRecord>): Project[] {
  return Object.entries(records).map(
    ([
      id,
      {
        identity: [postId, name, status],
        copy: [tagline, description, note],
        stack,
        links,
      },
    ]) => ({
      id,
      postId,
      name,
      icon: id,
      status,
      tagline,
      description,
      note,
      stack,
      links: links.map(([label, href]) => ({ label, href })),
    }),
  );
}
