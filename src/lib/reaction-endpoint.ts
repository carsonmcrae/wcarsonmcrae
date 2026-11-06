/**
 * Purpose: Validate public reaction endpoint configuration without loading request operations.
 * Scope: HTTPS/loopback transport, credential-free URLs, and CSP origin extraction.
 * Does NOT belong: Fetching, identity state, payload validation, or Worker implementation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export function reactionEndpoint(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  const url = new URL(raw);
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  )
    throw new Error('Reactions endpoint must use HTTPS.');
  if (url.username || url.password || url.search || url.hash)
    throw new Error('Reactions endpoint must not contain credentials, a query, or a fragment.');
  return url.href.replace(/\/$/, '');
}

export function reactionOrigin(raw: string | undefined): string {
  const endpoint = reactionEndpoint(raw);
  return endpoint ? new URL(endpoint).origin : '';
}
