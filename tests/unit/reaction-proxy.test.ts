/**
 * Purpose: Verify the reserved-host browser fixture at real TCP, CONNECT, TLS, and HTTP boundaries.
 * Scope: Count snapshots, native CORS, rejected targets/mutations, transport failure, and cleanup.
 * Does NOT belong: Production Worker behavior or browser UI assertions.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { Duplex } from 'node:stream';
import { localTls } from '../e2e/local-tls';
import { startReactionProxy } from '../e2e/reaction-proxy';

type Proxy = Awaited<ReturnType<typeof startReactionProxy>>;
const cleanups: (() => Promise<void>)[] = [];
const clients: Duplex[] = [];
let certificate: { key: Buffer; cert: Buffer };
let untrustedCA: Buffer;
beforeAll(() => {
  const files = localTls();
  certificate = { key: readFileSync(files.key), cert: readFileSync(files.cert) };
  untrustedCA = readFileSync(localTls().cert);
});
afterEach(async () => {
  for (const client of clients.splice(0)) client.destroy();
  await Promise.all(cleanups.splice(0).map((close) => close()));
  vi.restoreAllMocks();
});

async function fixture(counts: Record<string, number> = { born: 0 }) {
  const proxy = await startReactionProxy(certificate, counts);
  cleanups.push(proxy.close);
  return proxy;
}

function tunnel(proxy: Proxy, authority = 'reactions.daysforth.test:443') {
  return new Promise<{ response: http.IncomingMessage; socket: Duplex }>((resolve, reject) => {
    const request = http.request(proxy.server, { method: 'CONNECT', path: authority });
    request.once('connect', (response, socket, head) => {
      clients.push(socket);
      socket.unshift(head);
      resolve({ response, socket });
    });
    request.once('error', reject);
    request.end();
  });
}

async function request(proxy: Proxy, method = 'GET', target = '/reactions', body?: string) {
  const { response, socket } = await tunnel(proxy);
  expect(response.statusCode).toBe(200);
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>(
    (resolve, reject) => {
      const call = https.request(
        {
          hostname: 'reactions.daysforth.test',
          method,
          path: target,
          headers: { Origin: 'https://daysforth.test', Connection: 'close' },
          createConnection: () =>
            tls.connect({
              socket,
              servername: 'reactions.daysforth.test',
              ca: certificate.cert,
            }),
        },
        (response) => {
          let text = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => (text += chunk));
          response.once('end', () =>
            resolve({ status: response.statusCode!, headers: response.headers, body: text }),
          );
        },
      );
      call.once('error', reject);
      call.end(body);
    },
  );
}

it('serves an immutable zero-count snapshot through real TLS with native CORS headers', async () => {
  const counts = { born: 0, 'a/b': 0 };
  const proxy = await fixture(counts);
  counts.born = 7;
  const response = await request(proxy);
  expect(response.status).toBe(200);
  expect(JSON.parse(response.body)).toEqual({ born: 0, 'a/b': 0 });
  expect(response.headers).toMatchObject({
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'cache-control': 'no-store',
    'content-type': 'application/json',
  });
  expect(proxy.unexpected).toEqual([]);
  expect(proxy.blockedConnects).toBe(0);
});

it.each([
  {
    name: 'an untrusted certificate authority',
    peer: () => ({ ca: untrustedCA, servername: 'reactions.daysforth.test' }),
    code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
  },
  {
    name: 'a certificate with a different hostname',
    peer: () => ({ ca: certificate.cert, servername: 'different.daysforth.test' }),
    code: 'ERR_TLS_CERT_ALTNAME_INVALID',
  },
])('rejects $name through the real CONNECT tunnel', async ({ peer, code }) => {
  const proxy = await fixture();
  const { response, socket } = await tunnel(proxy);
  expect(response.statusCode).toBe(200);
  const connection = tls.connect({ socket, ...peer() });
  clients.push(connection);
  await expect(once(connection, 'secureConnect')).rejects.toMatchObject({ code });
  expect(connection.authorized).toBe(false);
  expect(proxy.unexpected).toEqual([]);
});

it.each(['/reactions', '/identity', '/reactions/born', '/reactions/a%2Fb'])(
  'allows a body-free native preflight for approved target %s',
  async (target) => {
    const proxy = await fixture({ born: 0, 'a/b': 0 });
    const response = await request(proxy, 'OPTIONS', target);
    expect(response.status).toBe(204);
    expect(response.body).toBe('');
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(proxy.unexpected).toEqual([]);
  },
);

it.each([
  ['POST', '/reactions/born'],
  ['DELETE', '/identity'],
  ['GET', '/elsewhere'],
  ['GET', '/reactions?private-query'],
  ['OPTIONS', '/reactions/unapproved'],
])(
  'rejects and guards unexpected native %s %s without retaining its body or query',
  async (method, target) => {
    const proxy = await fixture();
    const response = await request(proxy, method, target, 'body-must-not-be-retained');
    expect(response.status).toBe(405);
    expect(JSON.parse(response.body)).toEqual({ error: 'Unexpected fixture request.' });
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(proxy.unexpected).toEqual([`${method} ${target.split('?')[0]}`]);
    expect(JSON.stringify(proxy.unexpected)).not.toContain('body-must-not-be-retained');
    expect(JSON.stringify(proxy.unexpected)).not.toContain('private-query');
  },
);

it.each([
  'example.test:443',
  'www.google.com:443',
  'reactions.daysforth.test:80',
  'reactions.daysforth.test:443/elsewhere',
])('rejects CONNECT authority %s without opening an upstream connection', async (authority) => {
  const proxy = await fixture();
  const dial = vi.spyOn(net, 'connect');
  expect(proxy.blockedConnects).toBe(0);
  const { response } = await tunnel(proxy, authority);
  expect(response.statusCode).toBe(403);
  expect(dial).not.toHaveBeenCalled();
  expect(proxy.unexpected).toEqual([]);
  expect(proxy.blockedConnects).toBe(1);
  const repeated = await tunnel(proxy, authority);
  expect(repeated.response.statusCode).toBe(403);
  expect(proxy.blockedConnects).toBe(2);
  expect(dial).not.toHaveBeenCalled();
});

it('rejects ordinary HTTP proxy requests rather than forwarding them', async () => {
  const proxy = await fixture();
  const status = await new Promise<number>((resolve, reject) => {
    const call = http.get(proxy.server + '/elsewhere', (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode!));
    });
    call.once('error', reject);
  });
  expect(status).toBe(405);
  expect(proxy.unexpected).toEqual(['HTTP proxy requires CONNECT']);
});

it('closes both listeners and a half-open tunnel, with idempotent cleanup', async () => {
  const secure = vi.spyOn(https, 'createServer');
  const plain = vi.spyOn(http, 'createServer');
  const proxy = await fixture();
  const { socket } = await tunnel(proxy);
  const ended = once(socket, 'close');
  const first = proxy.close();
  expect(proxy.close()).toBe(first);
  await Promise.all([first, ended]);
  const backend = secure.mock.results[0]!.value;
  const listener = plain.mock.results[0]!.value;
  expect(backend.listening).toBe(false);
  expect(listener.listening).toBe(false);
  expect(backend.listenerCount('request')).toBe(0);
  expect(listener.listenerCount('connect')).toBe(0);
});

it('closes a client safely when its owned TLS backend becomes unavailable', async () => {
  const secure = vi.spyOn(https, 'createServer');
  const proxy = await fixture();
  const backend = secure.mock.results[0]!.value;
  await new Promise<void>((resolve) => backend.close(() => resolve()));
  const ended = await new Promise<boolean>((resolve) => {
    const socket = net.connect(Number(new URL(proxy.server).port), '127.0.0.1');
    clients.push(socket);
    socket.once('connect', () =>
      socket.write(
        'CONNECT reactions.daysforth.test:443 HTTP/1.1\r\nHost: reactions.daysforth.test\r\n\r\n',
      ),
    );
    socket.once('end', () => resolve(true));
  });
  expect(ended).toBe(true);
  expect(proxy.unexpected).toEqual([]);
});

it('releases an already-started TLS backend when binding the proxy listener fails', async () => {
  const secure = vi.spyOn(https, 'createServer');
  const server = http.createServer();
  const failure = new Error('Fixture listener unavailable');
  vi.spyOn(server, 'listen').mockImplementation(() => {
    queueMicrotask(() => server.emit('error', failure));
    return server;
  });
  vi.spyOn(http, 'createServer').mockReturnValueOnce(server);
  await expect(startReactionProxy(certificate, { born: 0 })).rejects.toBe(failure);
  expect(secure.mock.results[0]!.value.listening).toBe(false);
  expect(server.listenerCount('connect')).toBe(0);
});
