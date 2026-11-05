/**
 * Purpose: Build-time CSS endpoint for the timeline’s real date proportions.
 * Scope: Serves computed pin positions as a same-origin, CSP-compatible stylesheet.
 * Does NOT belong: Styling tokens or browser-side code.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { timelinePosts } from '../data/timeline';
import { chronological } from '../lib/timeline-model';
import { railStyles } from '../lib/timeline-rail';
const ordered = chronological(timelinePosts);
export function GET() {
  return new Response(
    railStyles(
      timelinePosts.filter((post) => post.pinned).map((post) => post.date),
      ordered.at(-1)!.date,
      ordered[0]!.date,
    ),
    { headers: { 'Content-Type': 'text/css; charset=utf-8' } },
  );
}
