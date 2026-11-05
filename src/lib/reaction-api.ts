/**
 * Purpose: A small, validated client for shared reaction counts.
 * Scope: Public endpoint validation, count payload validation, and idempotent anonymous votes.
 * Does NOT belong: DOM state, browser storage, or the Worker implementation.
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
export async function loadReactionCounts(
  endpoint: string,
  fetcher: typeof fetch,
): Promise<Record<string, number>> {
  const response = await fetcher(`${endpoint}/reactions`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Reactions are unavailable.');
  const result: unknown = await response.json();
  if (!isCounts(result)) throw new Error('Invalid reaction counts.');
  return result;
}
export async function submitReaction(
  endpoint: string,
  id: string,
  visitorId: string,
  fetcher: typeof fetch,
): Promise<number> {
  const response = await fetcher(`${endpoint}/reactions/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId }),
  });
  if (!response.ok) throw new Error('The reaction could not be saved.');
  const result: unknown = await response.json();
  if (!isCounts(result) || !Number.isSafeInteger(result['count']))
    throw new Error('Invalid reaction result.');
  return result['count']!;
}
