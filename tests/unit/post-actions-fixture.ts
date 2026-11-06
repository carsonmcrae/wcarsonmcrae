/**
 * Purpose: Compose real post controllers with controllable browser boundaries for interaction tests.
 * Scope: Shared action markup, consent/storage, mock requests, semantic activation and fixture disposal.
 * Does NOT belong: Assertions, production events or the timeline's deferred-loader composition.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, beforeEach, vi } from 'vitest';
import { attachPostActionEvents } from '../../src/lib/post-action-events';
import { initPostActions as displayPostActions } from '../../src/lib/post-actions';
import { clearPreferences } from '../../src/lib/consent';
import { consentingStorage } from './helpers';

export function initPostActions(
  doc: Document,
  win: Parameters<typeof displayPostActions>[1],
  endpoint: string,
  announce: (message: string) => void,
) {
  const state = displayPostActions(doc, win, endpoint);
  const commands = attachPostActionEvents(doc, win, endpoint, state, announce);
  return {
    activate: commands.activate,
    destroy: () => {
      state.destroy();
      commands.destroy();
    },
  };
}
export const identity = '12345678-1234-4234-8234-123456789abc';
const cleanups: (() => void)[] = [];
export function setup(
  options: {
    endpoint?: string;
    storage?: Storage;
    fetcher?: typeof fetch;
    rows?: boolean;
    multiple?: boolean;
  } = {},
) {
  document.body.innerHTML =
    options.rows === false
      ? ''
      : '<div data-post-actions="born" data-post-title="Born" data-post-url="https://daysforth.com/posts/born/"><button data-react aria-pressed="false"><span data-reaction-count>—</span></button><button data-save aria-pressed="false"><span data-save-label>Save</span></button><button data-copy>Copy link</button></div><button id="outside">Outside</button>';
  const storage = options.storage ?? consentingStorage();
  if (options.multiple) {
    const first = document.querySelector('[data-react]')!;
    first.setAttribute('data-react', 'heart');
    for (const kind of ['celebrate', 'laugh', 'support']) {
      const button = document.createElement('button');
      button.dataset['react'] = kind;
      button.dataset['reactionLabel'] = kind;
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<span data-reaction-count>—</span>';
      first.parentElement!.append(button);
    }
  }
  const events = new EventTarget();
  const win = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    localStorage: storage,
    location: { origin: 'https://daysforth.com' },
    navigator: { clipboard: { writeText: vi.fn(async (_text: string) => {}) } },
    crypto: {
      randomUUID: vi.fn(() => identity as `${string}-${string}-${string}-${string}-${string}`),
    },
    fetch: options.fetcher ?? vi.fn<typeof fetch>().mockResolvedValue(Response.json({ born: 0 })),
  };
  const announce = vi.fn<(message: string) => void>();
  const commands = initPostActions(document, win, options.endpoint ?? '', announce);
  cleanups.push(commands.destroy);
  const click = (action: string) =>
    document.querySelector<HTMLButtonElement>(`[data-${action}]`)!.click();
  const button = (action: string) => document.querySelector<HTMLButtonElement>(`[data-${action}]`)!;
  return { win, events, storage, announce, click, button, ...commands };
}
export function pendingReaction() {
  let finish!: (response: Response) => void;
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ born: 2 }))
    .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
  return {
    ...setup({ endpoint: 'https://api.example.com', fetcher }),
    fetcher,
    finish: (response: Response) => finish(response),
  };
}
beforeEach(() => clearPreferences(null));
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = '';
  document.head.querySelector('link[rel="canonical"]')?.remove();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
