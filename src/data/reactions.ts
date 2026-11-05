/**
 * Purpose: The positive reactions available on a Daysforth moment.
 * Scope: Stable reaction IDs, labels, and corresponding interface icons.
 * Does NOT belong: Vote storage, totals, or network calls.
 */
export const reactions = [
  { id: 'heart', label: 'Love', action: 'React to', icon: 'heart' },
  { id: 'celebrate', label: 'Celebrate', action: 'Celebrate', icon: 'celebrate' },
  { id: 'laugh', label: 'Smile', action: 'Smile', icon: 'laugh' },
  { id: 'support', label: 'Applaud', action: 'Applaud', icon: 'support' },
] as const;
export type ReactionKind = (typeof reactions)[number]['id'];
