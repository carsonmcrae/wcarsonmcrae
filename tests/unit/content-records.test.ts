/**
 * Purpose: Protect typed expansion of compact photo and project content.
 * Scope: Field ordering, optional moment links, project identities, and ordered external links.
 * Does NOT belong: Personal facts or rendering assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, it } from 'vitest';
import { galleryPhotos, projectRecords } from '../../src/lib/content-records';

it('preserves labelled photo order and only adds a moment link when supplied', () => {
  expect(
    galleryPhotos({
      first: ['first-photo', 'First photo alternative', 'First caption', 'first-moment'],
      second: ['second-photo', 'Second photo alternative', 'Second caption'],
    }),
  ).toEqual([
    {
      name: 'first-photo',
      alt: 'First photo alternative',
      caption: 'First caption',
      postId: 'first-moment',
    },
    { name: 'second-photo', alt: 'Second photo alternative', caption: 'Second caption' },
  ]);
});

it('expands each project record with matching artwork and ordered links', () => {
  expect(
    projectRecords({
      sample: {
        identity: ['sample-launch', 'Sample', 'Open source'],
        copy: ['Tagline', 'Description', 'Note'],
        stack: ['Astro'],
        links: [
          ['Product', 'https://example.com/'],
          ['Source', 'https://example.org/'],
        ],
      },
    }),
  ).toEqual([
    {
      id: 'sample',
      postId: 'sample-launch',
      name: 'Sample',
      icon: 'sample',
      status: 'Open source',
      tagline: 'Tagline',
      description: 'Description',
      note: 'Note',
      stack: ['Astro'],
      links: [
        { label: 'Product', href: 'https://example.com/' },
        { label: 'Source', href: 'https://example.org/' },
      ],
    },
  ]);
});
