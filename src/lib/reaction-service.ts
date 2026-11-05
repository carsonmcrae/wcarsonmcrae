/**
 * Purpose: The free-tier shared-reaction HTTP service.
 * Scope: Origin checks, bounded bodies, anonymous idempotent votes, hashed identifiers, and rate limits.
 * Constraints: No raw IPs or visitor IDs are stored; SQL uniqueness and triggers keep totals consistent.
 * Does NOT belong: Worker bindings/deployment or browser interaction.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
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
type JsonResponse = (data: unknown, status?: number) => Response;
interface ReactionResponse {
  headers: Record<string, string>;
  json: JsonResponse;
}
interface ReactionRoute {
  kind: 'totals' | 'identity' | 'reaction';
  postId?: string;
}
async function hashIdentity(value: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${value}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function allowRequest(
  request: Request,
  db: ReactionDatabase,
  salt: string,
  now: number,
  scope: 'reaction' | 'identity',
): Promise<boolean> {
  const hour = Math.floor(now / 3_600_000);
  // Keep existing reaction bucket hashes stable; erasure uses its own namespace and allowance.
  const prefix = scope === 'identity' ? 'identity:' : '';
  const bucket = await hashIdentity(
    `${prefix}${request.headers.get('CF-Connecting-IP') ?? 'local'}:${hour}`,
    salt,
  );
  const rate = await db
    .prepare(
      'INSERT INTO reaction_limits (bucket, hits, expires) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 WHERE hits < 20 RETURNING hits',
    )
    .bind(bucket, (hour + 1) * 3_600_000)
    .first<{ hits: number }>();
  return Boolean(rate);
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
function responseContext(request: Request, env: ReactionEnvironment) {
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
  const json: JsonResponse = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (origin && !allowed.includes(origin))
    return { origin, headers, json, early: json({ error: 'Origin not allowed' }, 403) };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  const early = request.method === 'OPTIONS' ? new Response(null, { status: 204, headers }) : null;
  return { origin, headers, json, early };
}
function resolveRoute(request: Request, postIds: string[]): ReactionRoute | null {
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  if (path === '/identity') return { kind: 'identity' };
  if (path === '/reactions') return { kind: 'totals' };
  const postId = /^\/reactions\/([a-z0-9-]+)$/.exec(path)?.[1];
  return postId && postIds.includes(postId) ? { kind: 'reaction', postId } : null;
}
function validateMethod(
  method: string,
  route: ReactionRoute,
  headers: Record<string, string>,
  json: JsonResponse,
): Response | null {
  if (!['GET', 'POST', 'DELETE'].includes(method)) {
    headers['Allow'] = 'GET, POST, DELETE, OPTIONS';
    return json({ error: 'Method not allowed' }, 405);
  }
  if (route.kind === 'identity')
    return method === 'DELETE' ? null : json({ error: 'Method not allowed' }, 405);
  if (method === 'DELETE') return json({ error: 'Method not allowed' }, 405);
  if (method === 'GET')
    return route.kind === 'totals' ? null : json({ error: 'Route not found' }, 404);
  return route.kind === 'totals' ? json({ error: 'Moment not found' }, 404) : null;
}
async function readCounts(db: ReactionDatabase, postIds: string[]) {
  const rows = await db
    .prepare('SELECT post_id, count FROM reaction_totals')
    .all<{ post_id: string; count: number }>();
  const counts = Object.fromEntries(postIds.map((id) => [id, 0]));
  for (const row of rows.results)
    if (postIds.includes(row.post_id)) counts[row.post_id] = row.count;
  return counts;
}
async function readVisitor(request: Request, json: JsonResponse): Promise<string | Response> {
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
  return payload.visitorId;
}
async function applyMutation(
  request: Request,
  route: ReactionRoute,
  db: ReactionDatabase,
  salt: string,
  visitorId: string,
  now: number,
  reply: ReactionResponse,
): Promise<Response> {
  const { headers, json } = reply;
  const identity = route.kind === 'identity';
  const visitor = await hashIdentity(visitorId, salt);
  const existing = identity
    ? null
    : await db
        .prepare('SELECT post_id FROM reactions WHERE post_id = ? AND visitor_hash = ?')
        .bind(route.postId!, visitor)
        .first<{ post_id: string }>();
  if (
    !existing &&
    !(await allowRequest(request, db, salt, now, identity ? 'identity' : 'reaction'))
  ) {
    headers['Retry-After'] = '3600';
    return json({ error: 'Too many requests. Try again later.' }, 429);
  }
  if (identity) {
    await db.prepare('DELETE FROM reactions WHERE visitor_hash = ?').bind(visitor).run();
    return json({ forgotten: true });
  }
  if (!existing) {
    await db
      .prepare(
        'INSERT OR IGNORE INTO reactions (post_id, visitor_hash, created_at) VALUES (?, ?, ?)',
      )
      .bind(route.postId!, visitor, now)
      .run();
  }
  const total = await db
    .prepare('SELECT count FROM reaction_totals WHERE post_id = ?')
    .bind(route.postId!)
    .first<{ count: number }>();
  if (!total) throw new Error('Missing reaction total');
  return json({ count: total.count });
}
async function handleMutation(
  request: Request,
  route: ReactionRoute,
  env: ReactionEnvironment,
  db: ReactionDatabase,
  now: number,
  reply: ReactionResponse,
) {
  const { json } = reply;
  const salt = env.RATE_LIMIT_SALT;
  if (!salt || salt.length < 32) return json({ error: 'Reactions are unavailable' }, 503);
  const visitor = await readVisitor(request, json);
  if (visitor instanceof Response) return visitor;
  return applyMutation(request, route, db, salt, visitor, now, reply);
}
export async function handleReactions(
  request: Request,
  env: ReactionEnvironment,
  postIds: string[],
  now = Date.now(),
): Promise<Response> {
  const reply = responseContext(request, env);
  const { origin, headers, json, early } = reply;
  if (early) return early;
  const route = resolveRoute(request, postIds);
  if (!route) return json({ error: 'Moment not found' }, 404);
  const invalidMethod = validateMethod(request.method, route, headers, json);
  if (invalidMethod) return invalidMethod;
  if (request.method !== 'GET' && !origin) return json({ error: 'Origin required' }, 403);
  const db = env.DB;
  if (!db) return json({ error: 'Reactions are unavailable' }, 503);
  try {
    if (request.method === 'GET') {
      const counts = await readCounts(db, postIds);
      headers['Cache-Control'] = 'public, max-age=15';
      return json(counts);
    }
    return await handleMutation(request, route, env, db, now, reply);
  } catch {
    return json({ error: 'Reactions are unavailable' }, 503);
  }
}
export async function cleanupReactionLimits(db: ReactionDatabase, now: number): Promise<void> {
  await db.prepare('DELETE FROM reaction_limits WHERE expires <= ?').bind(now).run();
  await db
    .prepare('DELETE FROM reactions WHERE created_at <= ?')
    .bind(now - 90 * 86400000)
    .run();
}
