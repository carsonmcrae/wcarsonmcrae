/**
 * Purpose: Build explicit identity-erasure requests for reaction service tests.
 * Scope: A test-only public origin, JSON body, and optional trusted network address.
 * Does NOT belong: Production request validation or real visitor identifiers.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function erasureRequest(visitorId: string, network = '192.0.2.1'): Request {
  return new Request('https://reactions.example.com/identity', {
    method: 'DELETE',
    headers: {
      Origin: 'https://wcarsonmcrae.com',
      'Content-Type': 'application/json',
      'CF-Connecting-IP': network,
    },
    body: JSON.stringify({ visitorId }),
  });
}
