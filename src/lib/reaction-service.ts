/**
 * Purpose: The free-tier shared-reaction HTTP service.
 * Scope: Origin checks, bounded bodies, anonymous idempotent votes, hashed identifiers, and rate limits.
 * Constraints: No raw IPs or visitor IDs are stored; SQL uniqueness and triggers keep totals consistent.
 * Does NOT belong: Worker bindings/deployment or browser interaction.
 */
export interface ReactionStatement {
  bind(...values: (string | number)[]): ReactionStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface ReactionDatabase {
  prepare(sql: string): ReactionStatement;
}
export interface ReactionEnvironment {
  DB?: ReactionDatabase;
  RATE_LIMIT_SALT?: string;
  ALLOWED_ORIGINS?: string;
}
async function hashIdentity(value: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${value}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function limitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 512) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
export async function handleReactions(
  request: Request,
  env: ReactionEnvironment,
  postIds: string[],
  now = Date.now(),
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? 'https://wcarsonmcrae.com')
    .split(',')
    .map((value) => value.trim());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  };
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (origin && !allowed.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  const postId = /^\/reactions\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (path !== '/reactions' && (!postId || !postIds.includes(postId)))
    return json({ error: 'Moment not found' }, 404);
  if (request.method !== 'GET' && request.method !== 'POST' && request.method !== 'DELETE') {
    headers['Allow'] = 'GET, POST, DELETE, OPTIONS';
    return json({ error: 'Method not allowed' }, 405);
  }
  if (request.method === 'GET' && path !== '/reactions')
    return json({ error: 'Route not found' }, 404);
  if (request.method !== 'GET' && !postId) return json({ error: 'Moment not found' }, 404);
  if (request.method !== 'GET' && !origin) return json({ error: 'Origin required' }, 403);
  const db = env.DB;
  if (!db) return json({ error: 'Reactions are unavailable' }, 503);
  try {
    if (request.method === 'GET') {
      const rows = await db
        .prepare('SELECT post_id, count FROM reaction_totals')
        .all<{ post_id: string; count: number }>();
      const counts = Object.fromEntries(postIds.map((id) => [id, 0]));
      for (const row of rows.results)
        if (postIds.includes(row.post_id)) counts[row.post_id] = row.count;
      headers['Cache-Control'] = 'public, max-age=15';
      return json(counts);
    }
    const salt = env.RATE_LIMIT_SALT;
    if (!salt || salt.length < 32) return json({ error: 'Reactions are unavailable' }, 503);
    if (request.headers.get('Content-Type')?.split(';')[0]?.trim() !== 'application/json')
      return json({ error: 'JSON required' }, 415);
    let payload: unknown;
    try {
      payload = JSON.parse(await limitedBody(request));
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('visitorId' in payload) ||
      typeof payload.visitorId !== 'string' ||
      !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(payload.visitorId)
    )
      return json({ error: 'Invalid visitor identity' }, 400);
    const visitor = await hashIdentity(payload.visitorId, salt);
    if (request.method === 'DELETE') {
      await db
        .prepare('DELETE FROM reactions WHERE post_id = ? AND visitor_hash = ?')
        .bind(postId!, visitor)
        .run();
    } else {
      const existing = await db
        .prepare('SELECT post_id FROM reactions WHERE post_id = ? AND visitor_hash = ?')
        .bind(postId!, visitor)
        .first<{ post_id: string }>();
      if (!existing) {
        const hour = Math.floor(now / 3_600_000);
        const bucket = await hashIdentity(
          `${request.headers.get('CF-Connecting-IP') ?? 'local'}:${hour}`,
          salt,
        );
        const rate = await db
          .prepare(
            'INSERT INTO reaction_limits (bucket, hits, expires) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 WHERE hits < 20 RETURNING hits',
          )
          .bind(bucket, (hour + 1) * 3_600_000)
          .first<{ hits: number }>();
        if (!rate) {
          headers['Retry-After'] = '3600';
          return json({ error: 'Too many reactions. Try again later.' }, 429);
        }
        await db
          .prepare(
            'INSERT OR IGNORE INTO reactions (post_id, visitor_hash, created_at) VALUES (?, ?, ?)',
          )
          .bind(postId!, visitor, now)
          .run();
      }
    }
    const total = await db
      .prepare('SELECT count FROM reaction_totals WHERE post_id = ?')
      .bind(postId!)
      .first<{ count: number }>();
    if (!total && request.method === 'POST') throw new Error('Missing reaction total');
    return json({ count: total?.count ?? 0 });
  } catch {
    return json({ error: 'Reactions are unavailable' }, 503);
  }
}
export async function cleanupReactionLimits(db: ReactionDatabase, now: number): Promise<void> {
  await db.prepare('DELETE FROM reaction_limits WHERE expires <= ?').bind(now).run();
}
