/**
 * Purpose: Build-time CSS endpoint for the timeline’s real date proportions.
 * Scope: Serves computed pin positions as a same-origin, CSP-compatible stylesheet.
 * Does NOT belong: Styling tokens or browser-side code.
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
    ) +
      '\n' +
      railStyles(
        timelinePosts.map((post) => post.date),
        ordered.at(-1)!.date,
        ordered[0]!.date,
        'post-location__point--',
      ),
    { headers: { 'Content-Type': 'text/css; charset=utf-8' } },
  );
}
