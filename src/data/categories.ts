/**
 * Purpose: Keep timeline category labels, icons, and visual tones consistent.
 * Scope: Presentation metadata shared by post chips and native category choices.
 * Does NOT belong: Filtering, confirmed post content, or browser state.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import type { IconName } from '../lib/icons';
import type { TimelineState } from '../lib/timeline-model';

export const categoryPresentation = {
  All: { label: 'All categories', icon: 'filter', tone: 'neutral' },
  Work: { label: 'Work', icon: 'work', tone: 'work' },
  Projects: { label: 'Projects', icon: 'portfolio', tone: 'projects' },
  Life: { label: 'Life', icon: 'life', tone: 'life' },
  Milestones: { label: 'Milestones', icon: 'celebrate', tone: 'neutral' },
  Saved: { label: 'Saved', icon: 'bookmark', tone: 'neutral' },
} as const satisfies Record<
  TimelineState['category'],
  { label: string; icon: IconName; tone: string }
>;
