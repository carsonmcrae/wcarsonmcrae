/**
 * Purpose: Trusted Phosphor glyphs shared once per document.
 * Scope: Licensed SVG sources, icon names, and extraction of symbol contents.
 * Does NOT belong: Brand marks or UI behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import heart from '@phosphor-icons/core/assets/regular/heart.svg?raw';
import bookmark from '@phosphor-icons/core/assets/regular/bookmark-simple.svg?raw';
import link from '@phosphor-icons/core/assets/regular/link-simple.svg?raw';
import grid from '@phosphor-icons/core/assets/regular/squares-four.svg?raw';
import timeline from '@phosphor-icons/core/assets/regular/chart-line.svg?raw';
import calendar from '@phosphor-icons/core/assets/regular/calendar-blank.svg?raw';
import filter from '@phosphor-icons/core/assets/regular/funnel.svg?raw';
import chevron from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
import moon from '@phosphor-icons/core/assets/regular/moon.svg?raw';
import menu from '@phosphor-icons/core/assets/regular/list.svg?raw';
import linkedin from '@phosphor-icons/core/assets/regular/linkedin-logo.svg?raw';
import github from '@phosphor-icons/core/assets/regular/github-logo.svg?raw';
import portfolio from '@phosphor-icons/core/assets/regular/stack.svg?raw';
import contact from '@phosphor-icons/core/assets/regular/envelope-simple.svg?raw';
import arrow from '@phosphor-icons/core/assets/regular/arrow-left.svg?raw';
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import work from '@phosphor-icons/core/assets/regular/briefcase.svg?raw';
import life from '@phosphor-icons/core/assets/regular/sun.svg?raw';
import about from '@phosphor-icons/core/assets/regular/user-circle.svg?raw';
import expand from '@phosphor-icons/core/assets/regular/arrows-out-simple.svg?raw';
import images from '@phosphor-icons/core/assets/regular/images.svg?raw';
import celebrate from '@phosphor-icons/core/assets/regular/confetti.svg?raw';
import laugh from '@phosphor-icons/core/assets/regular/smiley.svg?raw';
import support from '@phosphor-icons/core/assets/regular/hands-clapping.svg?raw';
export const icons = {
  heart,
  bookmark,
  link,
  grid,
  timeline,
  calendar,
  filter,
  chevron,
  moon,
  menu,
  linkedin,
  github,
  portfolio,
  contact,
  arrow,
  arrowRight,
  work,
  life,
  about,
  expand,
  images,
  celebrate,
  laugh,
  support,
};

export type IconName = keyof typeof icons;
export function iconBody(svg: string): string {
  return svg.replace(/<svg[^>]*>/, '').replace('</svg>', '');
}
