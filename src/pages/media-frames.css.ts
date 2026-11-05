/**
 * Purpose: Serve known cover proportions before lazy timeline media loads.
 * Scope: A same-origin static stylesheet built from approved timeline image metadata.
 * Does NOT belong: Browser event handling or image transformation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { timelinePosts } from '../data/timeline';
import { mediaFrameStyles } from '../lib/media-frames';

export function GET() {
  return new Response(mediaFrameStyles(timelinePosts), {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
}
