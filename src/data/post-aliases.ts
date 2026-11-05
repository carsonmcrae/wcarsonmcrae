/**
 * Purpose: Preserve published start-event links after consolidating app release events.
 * Scope: Stable old post IDs mapped to their canonical release posts.
 * Does NOT belong: Event content or redirect rendering.
 */
export const postAliases: Record<string, string> = {
  'ttsnative-started': 'ttsnative-1',
  'recalen-started': 'recalen-beta',
  'picpledge-started': 'picpledge-wedding',
};
