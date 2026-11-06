/**
 * Purpose: User-visible guarantees for Daysforth social actions.
 * Scope: Browser-local Save, shared counts/votes, persistence failures, lifecycle and offline resilience.
 * Does NOT belong: Copy destinations, detached command dispatch, SQL limits or screenshots.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clearPreferences, recordConsent } from '../../src/lib/consent';
import { describe, expect, it, vi } from 'vitest';
import { fillActionRows } from '../../src/lib/action-template';
import { consentingStorage, memoryStorage } from './helpers';
import { identity, initPostActions, pendingReaction, setup } from './post-actions-fixture';

describe('Save', () => {
  it('updates choices on consent changes without replacing cards or reducing shared counts', async () => {
    const { storage, button, destroy } = setup({ storage: memoryStorage() });
    const original = button('save');
    storage.setItem('daysforth.saved.born', 'true');
    storage.setItem('daysforth.reacted.born', 'true');
    recordConsent(storage, true);
    document.dispatchEvent(new CustomEvent('daysforth:storage'));
    expect(button('save')).toBe(original);
    expect(original.getAttribute('aria-pressed')).toBe('true');
    expect(button('react').disabled).toBe(true);
    clearPreferences(storage);
    recordConsent(storage, false);
    document.dispatchEvent(new CustomEvent('daysforth:storage'));
    expect(original.getAttribute('aria-pressed')).toBe('false');
    expect(button('react').disabled).toBe(false);
    destroy();
    storage.setItem('daysforth.saved.born', 'true');
    document.dispatchEvent(new CustomEvent('daysforth:storage'));
    expect(original.getAttribute('aria-pressed')).toBe('false');
  });
  it('respects an off decision without asking again and describes the memory-only bookmark honestly', () => {
    const raw = memoryStorage();
    recordConsent(raw, false);
    const request = vi.fn();
    document.addEventListener('daysforth:privacy-request', request);
    const { click, announce } = setup({ storage: raw });
    click('save');
    expect(request).not.toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(
      'Saved for this page. Allow storage to keep it between visits.',
    );
    document.removeEventListener('daysforth:privacy-request', request);
  });
  it('keeps a save in memory without permission and offers explicit persistence settings', () => {
    const raw = memoryStorage();
    const request = vi.fn();
    document.addEventListener('daysforth:privacy-request', request, { once: true });
    const { click } = setup({ storage: raw });
    click('save');
    expect(raw.getItem('daysforth.saved.born')).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('hydrates shared controls with distinct safe labels for each story', () => {
    document.body.innerHTML =
      '<template id="post-action-template"><div role="group"><button data-react="heart" data-reaction-label="React to"></button></div><button data-save></button><button data-copy></button></template><div data-post-actions="one" data-post-title="One &amp; two"></div><div data-post-actions="two" data-post-title="Another"></div>';
    fillActionRows(document);
    expect(document.querySelector('[data-save]')!.getAttribute('aria-label')).toBe(
      'Save One & two',
    );
    expect(document.querySelector('[data-copy]')!.getAttribute('aria-label')).toBe(
      'Copy link to One & two',
    );
    expect(document.querySelector('[data-react]')!.getAttribute('aria-label')).toBe(
      'React to One & two. Reaction count unavailable.',
    );
    expect(document.querySelectorAll('[role="group"]')[1]!.getAttribute('aria-label')).toBe(
      'Reactions to Another',
    );
  });
  it('persists Save locally, restores its label, and supports removing it', () => {
    const first = setup();
    first.click('save');
    expect(first.storage.getItem('daysforth.saved.born')).toBe('true');
    expect(first.button('save').getAttribute('aria-pressed')).toBe('true');
    expect(first.announce).toHaveBeenLastCalledWith('Saved in this browser.');
    first.destroy();
    const restored = setup({ storage: first.storage });
    expect(restored.button('save').textContent).toBe('Saved');
    restored.click('save');
    expect(restored.storage.getItem('daysforth.saved.born')).toBe('false');
    expect(restored.button('save').textContent).toBe('Save');
    expect(restored.announce).toHaveBeenLastCalledWith('Removed from saved moments.');
  });
  it('reports blocked persistence honestly', () => {
    const blocked = consentingStorage();
    vi.spyOn(blocked, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const { click, button, announce } = setup({ storage: blocked });
    click('save');
    expect(button('save').getAttribute('aria-pressed')).toBe('false');
    expect(announce).toHaveBeenCalledWith('Your browser could not save this moment.');
  });
});
describe('shared reactions', () => {
  it('leaves totals unknown when unconfigured and keeps Save usable during an outage', async () => {
    const none = setup();
    none.click('react');
    await vi.waitFor(() =>
      expect(none.announce).toHaveBeenCalledWith(expect.stringContaining('unavailable')),
    );
    expect(none.button('react').textContent).toBe('—');
    none.destroy();
    const failing = setup({
      endpoint: 'https://api.example.com',
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')),
    });
    failing.click('save');
    expect(failing.storage.getItem('daysforth.saved.born')).toBe('true');
    await vi.waitFor(() =>
      expect(failing.button('react').getAttribute('title')).toContain('temporarily unavailable'),
    );
    expect(failing.button('react').textContent).toBe('—');
  });
  it('loads shared totals and records a vote only after server success', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ born: 4 }))
      .mockResolvedValueOnce(Response.json({ count: 5 }));
    const { click, button, storage, announce, win } = setup({
      endpoint: 'https://api.example.com',
      fetcher,
    });
    await vi.waitFor(() => expect(button('react').textContent).toBe('4'));
    expect(button('react').getAttribute('aria-label')).toBe('React to Born. Reactions: 4.');
    click('react');
    expect(button('react').disabled).toBe(true);
    await vi.waitFor(() =>
      expect(announce).toHaveBeenLastCalledWith('Reaction added. It stays with this moment.'),
    );
    expect(button('react').textContent).toBe('5');
    expect(button('react').getAttribute('aria-label')).toBe('React to Born. Reactions: 5.');
    expect(button('react').disabled).toBe(true);
    expect(button('react').getAttribute('aria-pressed')).toBe('true');
    expect(storage.getItem('daysforth.visitor')).toBe(identity);
    expect(storage.getItem('daysforth.reacted.born')).toBe('true');
    expect(win.crypto.randomUUID).toHaveBeenCalledTimes(1);
    button('react').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(button('react').textContent).toBe('5');
    expect(button('react').getAttribute('aria-pressed')).toBe('true');
  });
  it('reuses a valid browser identity and repairs an invalid stored identity', async () => {
    const stored = consentingStorage({ 'daysforth.visitor': identity });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json({ count: 1 }));
    const first = setup({ endpoint: 'https://api.example.com', storage: stored, fetcher });
    first.click('react');
    await vi.waitFor(() =>
      expect(first.announce).toHaveBeenCalledWith('Reaction added. It stays with this moment.'),
    );
    expect(first.win.crypto.randomUUID).not.toHaveBeenCalled();
    first.destroy();
    stored.setItem('daysforth.visitor', '-'.repeat(36));
    stored.setItem('daysforth.reacted.born', 'false');
    const second = setup({
      endpoint: 'https://api.example.com',
      storage: stored,
      fetcher: vi
        .fn<typeof fetch>()
        .mockImplementation(async (_url, options) =>
          Response.json(options?.method === 'POST' ? { count: 1 } : {}),
        ),
    });
    second.click('react');
    await vi.waitFor(() =>
      expect(second.announce).toHaveBeenCalledWith('Reaction added. It stays with this moment.'),
    );
    expect(stored.getItem('daysforth.visitor')).toBe(identity);
  });
  it('restores permanent choices and supports ephemeral votes when browser access is blocked', async () => {
    const restored = setup({ storage: consentingStorage({ 'daysforth.reacted.born': 'true' }) });
    expect(restored.button('react').disabled).toBe(true);
    restored.button('react').disabled = false;
    restored.click('react');
    expect(restored.announce).not.toHaveBeenCalled();
    restored.destroy();
    const blocked = consentingStorage();
    vi.spyOn(blocked, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const noIdentity = setup({ endpoint: 'https://api.example.com', storage: blocked });
    noIdentity.click('react');
    await vi.waitFor(() =>
      expect(noIdentity.announce).toHaveBeenCalledWith(expect.stringContaining('browser storage')),
    );
    noIdentity.destroy();
    const unavailable = setup({
      endpoint: 'https://api.example.com',
      fetcher: vi
        .fn<typeof fetch>()
        .mockImplementation(async (_url, options) =>
          Response.json(options?.method === 'POST' ? { count: 1 } : {}),
        ),
    });
    Object.defineProperty(unavailable.win, 'localStorage', {
      get() {
        throw new Error('disabled');
      },
    });
    unavailable.destroy();
    clearPreferences(null);
    const { destroy } = initPostActions(
      document,
      unavailable.win,
      'https://api.example.com',
      unavailable.announce,
    );
    unavailable.click('react');
    await vi.waitFor(() => expect(unavailable.button('react').textContent).toBe('1'));
    destroy();
  });
  it('keeps failed votes retryable and never marks them as recorded', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ born: 2 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ count: 3 }));
    const { click, button, storage, announce } = setup({
      endpoint: 'https://api.example.com',
      fetcher,
    });
    await vi.waitFor(() => expect(button('react').textContent).toBe('2'));
    click('react');
    await vi.waitFor(() =>
      expect(announce).toHaveBeenCalledWith(expect.stringContaining('couldn’t be saved')),
    );
    expect(button('react').disabled).toBe(false);
    expect(button('react').getAttribute('aria-pressed')).toBe('false');
    expect(storage.getItem('daysforth.reacted.born')).toBeNull();
    click('react');
    await vi.waitFor(() => expect(button('react').textContent).toBe('3'));
  });
  it('does not submit twice if another click arrives while its first vote is pending', async () => {
    const { button, click, announce, fetcher, finish } = pendingReaction();
    await vi.waitFor(() => expect(button('react').textContent).toBe('2'));
    click('react');
    button('react').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(announce).not.toHaveBeenCalled();
    finish(Response.json({ count: 3 }));
    await vi.waitFor(() => expect(button('react').getAttribute('aria-pressed')).toBe('true'));
    expect(button('react').disabled).toBe(true);
    expect(button('react').textContent).toBe('3');
  });
  it.each([
    ['forget', true],
    ['forget', false],
    ['destroy', true],
    ['destroy', false],
  ] as const)(
    'does not restore or announce a pending reaction after %s (success %s)',
    async (action, success) => {
      const f = pendingReaction();
      const button = f.button('react');
      await vi.waitFor(() => expect(button.textContent).toBe('2'));
      const pending = f.activate(button);
      expect(button.disabled).toBe(true);
      if (action === 'forget') {
        clearPreferences(f.storage);
        recordConsent(f.storage, false);
        document.dispatchEvent(new CustomEvent('daysforth:storage'));
      } else f.destroy();
      f.finish(success ? Response.json({ count: 3 }) : new Response(null, { status: 503 }));
      await pending;
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.disabled).toBe(action === 'destroy');
      expect(button.textContent).toBe(action === 'forget' && success ? '3' : '2');
      expect(f.announce).not.toHaveBeenCalled();
      if (action === 'forget') {
        expect(f.storage.getItem('daysforth.visitor')).toBeNull();
        expect(f.storage.getItem('daysforth.reacted.born')).toBeNull();
      } else expect(f.storage.getItem('daysforth.reacted.born')).toBe(success ? 'true' : null);
    },
  );
  it('honors a choice recorded by another adapter before its visible button refreshes', async () => {
    const { storage, click, button, win, announce } = setup({
      endpoint: 'https://api.example.com',
    });
    storage.setItem('daysforth.reacted.born', 'true');
    click('react');
    await vi.waitFor(() => expect(button('react').getAttribute('aria-pressed')).toBe('true'));
    expect(button('react').disabled).toBe(true);
    expect(win.fetch).toHaveBeenCalledTimes(1);
    expect(announce).not.toHaveBeenCalled();
  });
  it('does not let a slow initial read block actions or overwrite a newer vote total', async () => {
    let resolve!: (response: Response) => void;
    const pending = new Promise<Response>((done) => {
      resolve = done;
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(Response.json({ count: 2 }));
    const { click, button, storage } = setup({ endpoint: 'https://api.example.com', fetcher });
    click('save');
    expect(storage.getItem('daysforth.saved.born')).toBe('true');
    click('react');
    await vi.waitFor(() => expect(button('react').textContent).toBe('2'));
    const response = Response.json({ born: 1 });
    const parse = vi.spyOn(response, 'json');
    resolve(response);
    await vi.waitFor(() => expect(parse).toHaveBeenCalled());
    expect(button('react').textContent).toBe('2');
  });
});
describe('lifecycle', () => {
  it('keeps a session-confirmed reaction selected through refresh when its optional flag cannot be written', async () => {
    const raw = consentingStorage({ 'daysforth.visitor': identity });
    const write = raw.setItem.bind(raw);
    vi.spyOn(raw, 'setItem').mockImplementation((key, value) => {
      if (key.startsWith('daysforth.reacted.')) throw new Error('storage full');
      write(key, value);
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, options) =>
        Response.json(options?.method === 'POST' ? { count: 3 } : { born: 3 }),
      );
    const f = setup({ storage: raw, endpoint: 'https://api.example.com', fetcher });
    f.click('react');
    await vi.waitFor(() => expect(f.button('react').getAttribute('aria-pressed')).toBe('true'));
    expect(raw.getItem('daysforth.reacted.born')).toBeNull();
    const resume = new Event('pageshow');
    Object.defineProperty(resume, 'persisted', { value: true });
    f.events.dispatchEvent(resume);
    document.dispatchEvent(new CustomEvent('daysforth:storage'));
    expect(f.button('react').getAttribute('aria-pressed')).toBe('true');
    expect(f.button('react').disabled).toBe(true);
    expect(fetcher.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
    clearPreferences(raw);
    recordConsent(raw, false);
    document.dispatchEvent(new CustomEvent('daysforth:storage'));
    expect(f.button('react').getAttribute('aria-pressed')).toBe('false');
    expect(f.button('react').disabled).toBe(false);
    expect(f.button('react').textContent).toBe('3');
  });
  it.each([true, false])(
    'does not paint a count response after disposal (success %s)',
    async (success) => {
      const pending = Promise.withResolvers<Response>();
      const f = setup({
        endpoint: 'https://api.example.com',
        fetcher: vi.fn<typeof fetch>().mockReturnValue(pending.promise),
      });
      const original = f.button('react').outerHTML;
      f.destroy();
      if (success) pending.resolve(Response.json({ born: 99 }));
      else pending.reject(new Error('late offline'));
      await pending.promise.catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(f.button('react').outerHTML).toBe(original);
    },
  );
  it('refreshes cached-page choices and totals without replacing the timeline cards', async () => {
    let finishInitial!: (response: Response) => void;
    const initial = new Promise<Response>((resolve) => {
      finishInitial = resolve;
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(initial)
      .mockResolvedValueOnce(Response.json({ born: 7 }));
    const { events, storage, button, destroy } = setup({
      endpoint: 'https://api.example.com',
      fetcher,
    });
    const original = button('save');
    const show = (persisted: boolean) => {
      const event = new Event('pageshow');
      Object.defineProperty(event, 'persisted', { value: persisted });
      events.dispatchEvent(event);
    };
    show(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    storage.setItem('daysforth.saved.born', 'true');
    storage.setItem('daysforth.reacted.born', 'true');
    show(true);
    expect(button('save')).toBe(original);
    expect(original.getAttribute('aria-pressed')).toBe('true');
    expect(button('react').disabled).toBe(true);
    await vi.waitFor(() => expect(button('react').textContent).toBe('7'));
    finishInitial(Response.json({ born: 4 }));
    await initial;
    await vi.waitFor(() => expect(button('react').textContent).toBe('7'));
    destroy();
    storage.setItem('daysforth.saved.born', 'false');
    show(true);
    expect(original.getAttribute('aria-pressed')).toBe('true');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps reaction choices independent and restores each choice from storage', async () => {
    const stored = consentingStorage({ 'daysforth.reacted.born--support': 'true' });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, options) =>
        Response.json(
          options?.method === 'POST'
            ? { count: 1 }
            : { born: 2, 'born--celebrate': 3, 'born--laugh': 0, 'born--support': 1 },
        ),
      );
    const { storage, announce } = setup({
      multiple: true,
      storage: stored,
      endpoint: 'https://api.example.com',
      fetcher,
    });
    const celebrate = document.querySelector<HTMLButtonElement>('[data-react="celebrate"]')!;
    const support = document.querySelector<HTMLButtonElement>('[data-react="support"]')!;
    expect(support.getAttribute('aria-pressed')).toBe('true');
    await vi.waitFor(() => expect(celebrate.textContent).toBe('3'));
    celebrate.click();
    await vi.waitFor(() => expect(celebrate.getAttribute('aria-pressed')).toBe('true'));
    expect(storage.getItem('daysforth.reacted.born--celebrate')).toBe('true');
    expect(fetcher.mock.calls[1]![0]).toBe('https://api.example.com/reactions/born--celebrate');
    support.click();
    expect(support.disabled).toBe(true);
    expect(support.textContent).toBe('1');
    expect(announce).toHaveBeenLastCalledWith('Reaction added. It stays with this moment.');
    expect(celebrate.getAttribute('aria-pressed')).toBe('true');
  });
  it('handles missing rows, unrelated clicks, and detaches listeners', () => {
    const empty = setup({ endpoint: 'https://api.example.com', rows: false });
    expect(empty.win.fetch).not.toHaveBeenCalled();
    empty.destroy();
    const present = setup();
    document.dispatchEvent(new MouseEvent('click'));
    document.querySelector<HTMLButtonElement>('#outside')!.click();
    present.destroy();
    present.click('save');
    expect(present.storage.getItem('daysforth.saved.born')).toBeNull();
    expect(present.announce).not.toHaveBeenCalled();
  });
});
