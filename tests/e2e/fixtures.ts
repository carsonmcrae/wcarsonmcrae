/**
 * Purpose: Isolate browser verification from the reserved reaction service endpoint.
 * Scope: Native HTTPS fixture responses, CORS preflights, and failures for unexpected requests.
 * Constraints: The reserved host stays local; asset caching stays native unless a test explicitly routes.
 * Does NOT belong: Live Worker traffic, weakening runtime-health assertions, or accepting unplanned writes.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, test as base } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { supportedReactionKeys } from '../../src/data/reaction-targets';
import { localTls } from './local-tls';
import { startReactionProxy } from './reaction-proxy';

const zeroCounts = Object.fromEntries(supportedReactionKeys.map((key) => [key, 0]));

type ReactionProxy = Awaited<ReturnType<typeof startReactionProxy>>;
type ReactionTls = { key: Buffer; cert: Buffer };

export const test = base.extend<{ reactionProxy: ReactionProxy }, { reactionTls: ReactionTls }>({
  reactionTls: [
    async ({ browserName: _browserName }, use) => {
      const tls = localTls();
      await use({ key: readFileSync(tls.key), cert: readFileSync(tls.cert) });
    },
    { scope: 'worker' },
  ],
  reactionProxy: async ({ reactionTls }, use) => {
    const proxy = await startReactionProxy(reactionTls, zeroCounts);
    try {
      await use(proxy);
    } finally {
      await proxy.close();
    }
    expect(
      proxy.unexpected,
      'Unexpected fixture request: install a specialized page.route for an intentional mutation.',
    ).toEqual([]);
  },
  proxy: async ({ reactionProxy }, use) => {
    await use({ server: reactionProxy.server, bypass: '127.0.0.1,localhost' });
  },
});
