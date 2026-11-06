/**
 * Purpose: Preserve published image reaction identities across independent releases.
 * Scope: Validate the static registry and require every reviewed base identity to remain supported.
 * Does NOT belong: Live vote storage, network requests, or inventing new reaction targets.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
function ids(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (
    !value.every((id: unknown) => typeof id === 'string' && /^(?:photo|screen)-[a-z\d-]+$/.test(id))
  )
    return null;
  return new Set(value).size === value.length ? value : null;
}

export function checkPublishedImageIds(current: unknown, previous: unknown = []): string[] {
  const next = ids(current);
  const base = ids(previous);
  if (!next || !base)
    return ['Published image reaction registries must contain unique valid image IDs.'];
  const removed = base.filter((id) => !next.includes(id));
  return removed.map((id) => `Published image reaction identity must remain supported: ${id}.`);
}
