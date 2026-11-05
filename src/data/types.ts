/**
 * Purpose: The TypeScript shapes for every piece of site content.
 * Scope: Profile, links, projects, roles, timeline, principles, interests, and dogs, plus which
 *   fields accept inline markdown ([links](/path/), *emphasis*, **strong**).
 * Does NOT belong: The content itself (the other files in src/data).
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */

export interface LinkItem {
  label: string;
  href: string;
  /** Optional short description shown next to the link. */
  description?: string;
  icon?: string;
}

type SocialId = 'github' | 'linkedin' | 'portfolio' | 'email';

export interface SocialLink extends LinkItem {
  id: SocialId;
}

export interface Profile {
  name: string;
  fullName: string;
  firstName: string;
  /** Approved public headline. */
  headline: string;
  location: string;
  employer: string;
  /** Short description used in metadata and link previews. */
  summary: string;
  /** Filename (without extension) of an approved portrait in src/assets/photos/. */
  portrait: string;
  portraitAlt: string;
  /** Public email address. Leave null to keep email off the site. */
  email: string | null;
}

type ProjectStatus =
  'Open source' | 'Live' | 'Private beta' | 'Operating business' | 'In development';

export interface Project {
  id: string;
  postId: string;
  name: string;
  /** Key of an app icon in src/assets/projects/ (filename without extension). */
  icon: string;
  status: ProjectStatus;
  tagline: string;
  /** Inline markdown. */
  description: string;
  /** Inline markdown: a personal note shown on the work page. */
  note?: string;
  stack: string[];
  /** The first link is the project's name link; labels read as nouns in a sentence. */
  links: LinkItem[];
}

export interface Role {
  organization: string;
  title: string;
  /** Leave undefined until confirmed; dates are never guessed. */
  dates?: string;
  /** Inline markdown. */
  summary: string;
  groups: { title: string; items: string[] }[];
}

export interface TimelineEntry {
  when: string;
  title: string;
  /** Inline markdown. */
  detail: string;
}

export interface Principle {
  title: string;
  /** Inline markdown. */
  detail: string;
}

export interface Interest {
  id: string;
  name: string;
  /** Inline markdown. */
  detail: string;
}

export interface Dog {
  name: string;
  postId: string;
  breed: string;
  coat: string;
  title: string;
  /** Inline markdown. */
  detail: string;
  /** Filename (without extension) of an approved photo in src/assets/photos/. */
  photo: string;
  photoAlt: string;
  /** Which coat swatch to show beside the name. */
  swatch: 'margot' | 'quinn';
}

export interface NowItem {
  label: string;
  /** Inline markdown. */
  value: string;
}
