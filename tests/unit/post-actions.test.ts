/**
 * Purpose: User-visible guarantees for Daysforth social actions.
 * Scope: Browser-local Save, canonical Copy, shared counts/votes, persistence failures, and offline resilience.
 * Does NOT belong: SQL rate limiting or screenshot assertions.
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initPostActions } from '../../src/lib/post-actions';
import { fillActionRows } from '../../src/lib/action-template';
import { memoryStorage, throwingStorage } from './helpers';
const identity = '12345678-1234-4234-8234-123456789abc';
const cleanups: (() => void)[] = [];
function setup(
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
  const storage = options.storage ?? memoryStorage();
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
  const win = {
    localStorage: storage,
    location: { origin: 'https://daysforth.com' },
    navigator: { clipboard: { writeText: vi.fn(async (_text: string) => {}) } },
    crypto: {
      randomUUID: vi.fn(() => identity as `${string}-${string}-${string}-${string}-${string}`),
    },
    fetch: options.fetcher ?? vi.fn<typeof fetch>().mockResolvedValue(Response.json({ born: 0 })),
  };
  const announce = vi.fn<(message: string) => void>();
  const destroy = initPostActions(document, win, options.endpoint ?? '', announce);
  cleanups.push(destroy);
  const click = (action: string) =>
    document.querySelector<HTMLButtonElement>(`[data-${action}]`)!.click();
  const button = (action: string) => document.querySelector<HTMLButtonElement>(`[data-${action}]`)!;
  return { win, storage, announce, click, button, destroy };
}
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Save and Copy', () => {
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
    const { click, button, announce } = setup({ storage: throwingStorage() });
    click('save');
    expect(button('save').getAttribute('aria-pressed')).toBe('false');
    expect(announce).toHaveBeenCalledWith('Your browser could not save this moment.');
  });
  it('copies a canonical permalink and supplies a manual alternative when the clipboard fails', async () => {
    const { win, click, announce } = setup();
    click('copy');
    await vi.waitFor(() => expect(announce).toHaveBeenLastCalledWith('Link copied.'));
    expect(win.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://daysforth.com/posts/born/',
    );
    win.navigator.clipboard.writeText.mockRejectedValueOnce(new Error('blocked'));
    click('copy');
    await vi.waitFor(() =>
      expect(announce).toHaveBeenLastCalledWith(
        'Copy this link: https://daysforth.com/posts/born/',
      ),
    );
    Object.assign(win, { navigator: {} });
    click('copy');
    await vi.waitFor(() =>
      expect(announce).toHaveBeenLastCalledWith(
        'Copy this link: https://daysforth.com/posts/born/',
      ),
    );
  });
});
describe('shared reactions', () => {
  it('leaves totals unknown when unconfigured and keeps Save usable during an outage', async () => {
    const none = setup();
    none.click('react');
    expect(none.announce).toHaveBeenCalledWith(expect.stringContaining('unavailable'));
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
      .mockResolvedValueOnce(Response.json({ count: 5 }))
      .mockResolvedValueOnce(Response.json({ count: 4 }));
    const { click, button, storage, announce, win } = setup({
      endpoint: 'https://api.example.com',
      fetcher,
    });
    await vi.waitFor(() => expect(button('react').textContent).toBe('4'));
    expect(button('react').getAttribute('aria-label')).toBe('React to Born. Reactions: 4.');
    click('react');
    expect(button('react').disabled).toBe(true);
    await vi.waitFor(() => expect(announce).toHaveBeenLastCalledWith('Reaction added.'));
    expect(button('react').textContent).toBe('5');
    expect(button('react').getAttribute('aria-label')).toBe('React to Born. Reactions: 5.');
    expect(button('react').disabled).toBe(false);
    expect(button('react').getAttribute('aria-pressed')).toBe('true');
    expect(storage.getItem('daysforth.visitor')).toBe(identity);
    expect(storage.getItem('daysforth.reacted.born')).toBe('true');
    expect(win.crypto.randomUUID).toHaveBeenCalledTimes(1);
    click('react');
    await vi.waitFor(() => expect(announce).toHaveBeenLastCalledWith('Reaction removed.'));
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[2]![1]!.method).toBe('DELETE');
    expect(button('react').textContent).toBe('4');
    expect(button('react').getAttribute('aria-pressed')).toBe('false');
    expect(storage.getItem('daysforth.reacted.born')).toBe('false');
  });
  it('reuses a valid browser identity and repairs an invalid stored identity', async () => {
    const stored = memoryStorage({ 'daysforth.visitor': identity });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json({ count: 1 }));
    const first = setup({ endpoint: 'https://api.example.com', storage: stored, fetcher });
    first.click('react');
    await vi.waitFor(() => expect(first.announce).toHaveBeenCalledWith('Reaction added.'));
    expect(first.win.crypto.randomUUID).not.toHaveBeenCalled();
    first.destroy();
    stored.setItem('daysforth.visitor', '-'.repeat(36));
    stored.setItem('daysforth.reacted.born', 'false');
    const second = setup({
      endpoint: 'https://api.example.com',
      storage: stored,
      fetcher: vi
        .fn<typeof fetch>()
        .mockImplementation(async (_url, options) => Response.json(options ? { count: 1 } : {})),
    });
    second.click('react');
    await vi.waitFor(() => expect(second.announce).toHaveBeenCalledWith('Reaction added.'));
    expect(stored.getItem('daysforth.visitor')).toBe(identity);
  });
  it('restores a previous reaction and gracefully handles storage access failures', async () => {
    const restored = setup({
      endpoint: 'https://api.example.com',
      storage: memoryStorage({ 'daysforth.reacted.born': 'true' }),
    });
    expect(restored.button('react').getAttribute('aria-pressed')).toBe('true');
    restored.destroy();
    const disabled = setup({ storage: throwingStorage(), endpoint: 'https://api.example.com' });
    disabled.click('react');
    expect(disabled.announce).toHaveBeenCalledWith(expect.stringContaining('browser storage'));
    expect(disabled.win.fetch).toHaveBeenCalledTimes(1);
    disabled.destroy();
    const unavailable = setup({ endpoint: 'https://api.example.com' });
    Object.defineProperty(unavailable.win, 'localStorage', {
      get() {
        throw new Error('disabled');
      },
    });
    unavailable.destroy();
    const destroy = initPostActions(
      document,
      unavailable.win,
      'https://api.example.com',
      unavailable.announce,
    );
    unavailable.click('react');
    expect(unavailable.announce).toHaveBeenCalledWith(expect.stringContaining('browser storage'));
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
  it('keeps reaction choices independent and restores each choice from storage', async () => {
    const stored = memoryStorage({ 'daysforth.reacted.born--support': 'true' });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, options) =>
        Response.json(
          options
            ? { count: options.method === 'DELETE' ? 0 : 1 }
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
    await vi.waitFor(() => expect(announce).toHaveBeenLastCalledWith('Reaction removed.'));
    expect(support.textContent).toBe('0');
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
