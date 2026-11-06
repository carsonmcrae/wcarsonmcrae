/**
 * Purpose: Serve reserved reaction fixtures through native HTTPS without disabling asset caching.
 * Scope: Loopback CONNECT, denied-tunnel diagnostics, zero-count reads, CORS, and owned-resource cleanup.
 * Constraints: Only reactions.daysforth.test:443 is accepted; no upstream DNS or request bodies are used.
 * Does NOT belong: Live Worker traffic, accepted mutations, or browser request interception.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import http from 'node:http';
import https from 'node:https';
import net, { type AddressInfo, type Server } from 'node:net';
import type { Duplex } from 'node:stream';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'cache-control': 'no-store',
};

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

export async function startReactionProxy(
  tls: { key: Buffer; cert: Buffer },
  zeroCounts: Readonly<Record<string, number>>,
) {
  const unexpected: string[] = [];
  let blockedConnects = 0;
  const sockets = new Set<Duplex>();
  const track = (socket: Duplex) => {
    sockets.add(socket);
    const fail = () => socket.destroy();
    socket.on('error', fail);
    socket.once('close', () => {
      sockets.delete(socket);
      socket.off('error', fail);
    });
    return socket;
  };
  const body = JSON.stringify(zeroCounts);
  const targets = new Set([
    '/reactions',
    '/identity',
    ...Object.keys(zeroCounts).map((key) => `/reactions/${encodeURIComponent(key)}`),
  ]);
  const backend = https.createServer(tls, (request, response) => {
    request.resume();
    // Node's server request parser supplies the method and request target.
    const target = request.url!;
    if (request.method === 'OPTIONS' && targets.has(target)) {
      response.writeHead(204, cors).end();
      return;
    }
    if (request.method === 'GET' && target === '/reactions') {
      response.writeHead(200, { ...cors, 'content-type': 'application/json' }).end(body);
      return;
    }
    unexpected.push(`${request.method} ${target.split('?')[0]}`);
    response
      .writeHead(405, { ...cors, 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'Unexpected fixture request.' }));
  });
  const proxy = http.createServer((request, response) => {
    request.resume();
    unexpected.push('HTTP proxy requires CONNECT');
    response.writeHead(405).end();
  });
  backend.on('connection', track);
  proxy.on('connection', track);
  let backendPort: number;
  proxy.on('connect', (request, client, head) => {
    if (request.url !== 'reactions.daysforth.test:443') {
      blockedConnects++;
      client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    const upstream = track(net.connect({ host: '127.0.0.1', port: backendPort }));
    client.once('close', () => upstream.destroy());
    upstream.once('close', () => client.destroy());
    upstream.once('connect', () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      upstream.write(head);
      client.pipe(upstream).pipe(client);
    });
  });
  let closed: Promise<void> | undefined;
  const close = () =>
    (closed ??= (async () => {
      for (const socket of sockets) socket.destroy();
      await Promise.all(
        [backend, proxy].map(
          (server) => new Promise<void>((resolve) => server.close(() => resolve())),
        ),
      );
      backend.removeAllListeners();
      proxy.removeAllListeners();
    })());
  try {
    backendPort = await listen(backend);
    const port = await listen(proxy);
    return {
      server: `http://127.0.0.1:${port}`,
      unexpected,
      // Browser-process tunnels remain denied independently of reserved-service request guards.
      get blockedConnects() {
        return blockedConnects;
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
