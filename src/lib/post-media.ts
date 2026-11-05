/**
 * Purpose: Consistent cover and album metadata for every post presentation.
 * Scope: Resolves photo/screen/icon sources, aspect classes, and gallery counts.
 * Does NOT belong: Image optimization, storage, or post content.
 */
import type { TimelinePost } from '../data/timeline';
export function postMedia(post: TimelinePost): {
  name: string;
  kind: 'photo' | 'screen' | 'project';
  alt: string;
  count: number;
} {
  const kind = post.image ? (post.imageKind ?? 'photo') : 'project';
  return {
    name: post.image ?? post.project ?? '',
    kind,
    alt: post.imageAlt ?? `${post.title} app icon`,
    count: 1 + (post.gallery?.length ?? 0),
  };
}
