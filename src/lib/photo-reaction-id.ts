/**
 * Purpose: Give an approved image one permanent reaction identity across presentations.
 * Scope: Canonical asset stems with separate photograph and interface-capture namespaces.
 * Does NOT belong: Image URLs, approval registries, or browser reaction state.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function photoReactionId(name: string, kind: 'photo' | 'screen' = 'photo'): string {
  return `${kind}-${name}`;
}
