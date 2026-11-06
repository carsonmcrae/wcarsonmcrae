/**
 * Purpose: Preserve native modified-link behavior when enhancing deliberate clicks.
 * Scope: Resolve the nearest matching control for an unmodified primary mouse or keyboard click.
 * Does NOT belong: Lazy loading, navigation, event cancellation, or feature activation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function clickedControl(event: MouseEvent, selector: string): HTMLElement | null {
  const target = event.target;
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(target instanceof Element)
  )
    return null;
  return target.closest<HTMLElement>(selector);
}
