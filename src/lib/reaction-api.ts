/**
 * Purpose: A small, validated client for shared reaction counts.
 * Scope: Bounded requests, count validation, and idempotent anonymous votes.
 * Does NOT belong: DOM state, browser storage, or the Worker implementation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export { reactionEndpoint, reactionOrigin } from './reaction-endpoint';
function isCounts(value: unknown): value is Record<string, number> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (count) => typeof count === 'number' && Number.isSafeInteger(count) && count >= 0,
    )
  );
}
async function requestJson(
  url: string,
  fetcher: typeof fetch,
  options: RequestInit,
  failure: string,
): Promise<unknown> {
  const controller = new AbortController();
  let timer!: ReturnType<typeof globalThis.setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = globalThis.setTimeout(() => {
      controller.abort();
      const error = new Error('The reaction request timed out.');
      error.name = 'REACTIONS_DEADLINE';
      reject(error);
    }, 5000);
  });
  const request = async () => {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(failure);
    return response.json() as Promise<unknown>;
  };
  try {
    return await Promise.race([request(), deadline]);
  } finally {
    globalThis.clearTimeout(timer);
  }
}
export async function loadReactionCounts(
  endpoint: string,
  fetcher: typeof fetch,
): Promise<Record<string, number>> {
  const result = await requestJson(
    `${endpoint}/reactions`,
    fetcher,
    { cache: 'no-store' },
    'Reactions are unavailable.',
  );
  if (!isCounts(result)) throw new Error('Invalid reaction counts.');
  return result;
}
export async function submitReaction(
  endpoint: string,
  id: string,
  visitorId: string,
  fetcher: typeof fetch,
): Promise<number> {
  const result = await requestJson(
    `${endpoint}/reactions/${encodeURIComponent(id)}`,
    fetcher,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
    },
    'The reaction could not be saved.',
  );
  if (!isCounts(result) || !Number.isSafeInteger(result['count']))
    throw new Error('Invalid reaction result.');
  return result['count']!;
}
