/**
 * Purpose: Preserve a deferred post command without replaying an unrelated document click.
 * Scope: Detached-card Save/Copy/React, native disabled controls, unrelated targets and disposal.
 * Does NOT belong: Deferred module loading or browser layout/scroll assertions.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { expect, it, vi } from 'vitest';
import { initDisclosures } from '../../src/lib/disclosures';
import { identity, setup } from './post-actions-fixture';

it('saves the original detached card without closing a category menu or dispatching another click', async () => {
  const f = setup();
  const save = f.button('save');
  const label = save.querySelector('[data-save-label]')!;
  const menu = document.createElement('details');
  menu.dataset['timelineMenu'] = '';
  menu.innerHTML = '<summary>Category</summary><button>Saved</button>';
  document.body.append(menu);
  const stopDisclosures = initDisclosures(document);
  const documentClick = vi.fn();
  const saved = vi.fn();
  document.addEventListener('click', documentClick);
  document.addEventListener('daysforth:saved', saved);
  try {
    menu.open = true;
    save.closest('[data-post-actions]')!.remove();
    expect(save.isConnected).toBe(false);
    await f.activate(label);
    expect(f.storage.getItem('daysforth.saved.born')).toBe('true');
    expect(save.getAttribute('aria-pressed')).toBe('true');
    expect(label.textContent).toBe('Saved');
    expect(f.announce).toHaveBeenCalledWith('Saved in this browser.');
    expect(saved).toHaveBeenCalledTimes(1);
    expect(documentClick).not.toHaveBeenCalled();
    expect(menu.open).toBe(true);
  } finally {
    stopDisclosures();
    document.removeEventListener('click', documentClick);
    document.removeEventListener('daysforth:saved', saved);
  }
});

it('copies the original detached row’s permalink from a nested button target', async () => {
  const f = setup();
  const copy = f.button('copy');
  const icon = document.createElement('span');
  copy.append(icon);
  copy.closest('[data-post-actions]')!.remove();
  await f.activate(icon);
  expect(f.win.navigator.clipboard.writeText).toHaveBeenCalledWith(
    'https://daysforth.com/posts/born/',
  );
  expect(f.announce).toHaveBeenCalledWith('Link copied.');
});

it('applies a permanent reaction to its original detached row and updates the same count', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ born: 2 }))
    .mockResolvedValueOnce(Response.json({ count: 3 }));
  const f = setup({ endpoint: 'https://api.test', fetcher });
  const react = f.button('react');
  const count = react.querySelector('[data-reaction-count]')!;
  await vi.waitFor(() => expect(count.textContent).toBe('2'));
  react.closest('[data-post-actions]')!.remove();
  await f.activate(count);
  expect(fetcher).toHaveBeenLastCalledWith(
    'https://api.test/reactions/born',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ visitorId: identity }) }),
  );
  expect(count.textContent).toBe('3');
  expect(react.getAttribute('aria-pressed')).toBe('true');
  expect(react.disabled).toBe(true);
  expect(f.storage.getItem('daysforth.reacted.born')).toBe('true');
  expect(f.announce).toHaveBeenCalledWith('Reaction added. It stays with this moment.');
});

it.each(['save', 'copy', 'react'])(
  'does not activate a disabled %s command directly',
  async (action) => {
    const f = setup();
    const button = f.button(action);
    button.disabled = true;
    await f.activate(button);
    expect(f.storage.getItem('daysforth.saved.born')).toBeNull();
    expect(f.storage.getItem('daysforth.reacted.born')).toBeNull();
    expect(f.win.navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(f.win.fetch).not.toHaveBeenCalled();
    expect(f.announce).not.toHaveBeenCalled();
  },
);

it('ignores unrelated elements and buttons without a post command', async () => {
  const f = setup();
  await f.activate(document.querySelector('#outside')!);
  const row = document.querySelector('[data-post-actions]')!;
  await f.activate(row);
  const unrelated = document.createElement('button');
  row.append(unrelated);
  await f.activate(unrelated);
  expect(f.storage.getItem('daysforth.saved.born')).toBeNull();
  expect(f.announce).not.toHaveBeenCalled();
});

it('does not run a retained semantic command after its controller is destroyed', async () => {
  const f = setup();
  const save = f.button('save');
  f.destroy();
  await f.activate(save);
  expect(f.storage.getItem('daysforth.saved.born')).toBeNull();
  expect(f.announce).not.toHaveBeenCalled();
});
