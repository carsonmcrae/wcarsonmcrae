/**
 * Purpose: Keep photograph reactions honest and attached to the right photo through asynchronous changes.
 * Scope: Real controller integration, unknown counts, independent IDs, consent, stale requests, and disposal.
 * Does NOT belong: Server SQL policy, viewer navigation, or production service calls.
 * @vitest-environment happy-dom
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { afterEach, expect, it, vi } from 'vitest';
import { initPhotoReactionControls } from '../../src/lib/photo-reaction-controls';
import { clearPreferences, recordConsent } from '../../src/lib/consent';
import { reactions, type ReactionKind } from '../../src/data/reactions';
import { consentingStorage, disposeDocument, memoryStorage } from './helpers';

const stops: (() => void)[] = [];
const first = 'photo-margot-1';
const second = 'photo-quinn-1';
const identity = '12345678-1234-4234-8234-123456789abc';
afterEach(() => {
  clearPreferences(null);
  disposeDocument(stops);
  vi.unstubAllGlobals();
});

function fixture(endpoint = 'https://api.test', storage = memoryStorage()) {
  document.body.innerHTML = `<dialog><div data-photo-reactions>${reactions.map(({ id, label }) => `<button data-photo-react="${id}"><span>${label}</span><span data-photo-reaction-count>—</span></button>`).join('')}</div><p data-photo-reaction-status></p></dialog>`;
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('fetch', fetcher);
  vi.spyOn(window.crypto, 'randomUUID').mockReturnValue(identity);
  const dialog = document.querySelector('dialog')!;
  const controls = initPhotoReactionControls(dialog, window, endpoint);
  stops.push(controls.destroy);
  const button = (kind: ReactionKind = 'heart') =>
    dialog.querySelector<HTMLButtonElement>(`[data-photo-react="${kind}"]`)!;
  const count = (kind: ReactionKind = 'heart') =>
    button(kind).querySelector('[data-photo-reaction-count]')!.textContent;
  const status = dialog.querySelector('[data-photo-reaction-status]')!;
  const resume = (persisted: boolean) => {
    const event = new Event('pageshow');
    Object.defineProperty(event, 'persisted', { value: persisted });
    window.dispatchEvent(event);
  };
  return { dialog, controls, fetcher, storage, button, count, status, resume };
}

function pendingVote() {
  const f = fixture();
  const load = Promise.withResolvers<Response>();
  const vote = Promise.withResolvers<Response>();
  f.fetcher.mockReturnValueOnce(load.promise).mockReturnValueOnce(vote.promise);
  f.controls.select(first);
  f.button().click();
  return { ...f, load, vote };
}

it('shows unknown totals until a valid GET and keeps photo IDs and reaction kinds independent', async () => {
  const f = fixture();
  const load = Promise.withResolvers<Response>();
  f.fetcher.mockReturnValueOnce(load.promise);
  f.controls.select(first);
  expect(f.count()).toBe('—');
  expect(f.button().getAttribute('aria-label')).toContain('count unavailable');
  load.resolve(
    Response.json({ [first]: 5, [`${first}--celebrate`]: 2, [`${first}--laugh`]: 0, [second]: 9 }),
  );
  await vi.waitFor(() => expect(f.count()).toBe('5'));
  expect(f.count('celebrate')).toBe('2');
  expect(f.count('laugh')).toBe('0');
  expect(f.count('support')).toBe('—');
  f.fetcher.mockResolvedValueOnce(Response.json({ count: 6 }));
  f.button().querySelector('span')!.click();
  expect(f.button().disabled).toBe(true);
  await vi.waitFor(() => expect(f.count()).toBe('6'));
  expect(f.fetcher).toHaveBeenLastCalledWith(
    'https://api.test/reactions/photo-margot-1',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ visitorId: identity }) }),
  );
  expect(f.button().getAttribute('aria-pressed')).toBe('true');
  expect(f.status.textContent).toBe('Reaction added. It stays with this photo.');
  expect(f.storage.getItem('daysforth.visitor')).toBeNull();
  recordConsent(f.storage, true);
  document.dispatchEvent(new CustomEvent('daysforth:storage'));
  expect(f.storage.getItem('daysforth.reacted.photo-margot-1')).toBe('true');
  f.controls.select(second);
  expect(f.count()).toBe('9');
  expect(f.button().disabled).toBe(false);
  expect(f.status.textContent).toBe('');
  clearPreferences(f.storage);
  recordConsent(f.storage, false);
  f.controls.select(first);
  document.dispatchEvent(new CustomEvent('daysforth:storage'));
  expect(f.button().getAttribute('aria-pressed')).toBe('false');
  expect(f.count()).toBe('6');
});

it('ignores older GET responses and refreshes only after a selected viewer returns from bfcache', async () => {
  const f = fixture();
  f.resume(true);
  f.controls.select('');
  expect(f.fetcher).not.toHaveBeenCalled();
  const older = Promise.withResolvers<Response>();
  const newer = Promise.withResolvers<Response>();
  f.fetcher.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  f.controls.select(first);
  f.controls.select(second);
  f.resume(false);
  expect(f.fetcher).toHaveBeenCalledTimes(1);
  f.resume(true);
  newer.resolve(Response.json({ [first]: 12, [second]: 23 }));
  await vi.waitFor(() => expect(f.count()).toBe('23'));
  older.resolve(Response.json({ [first]: 1, [second]: 2 }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.count()).toBe('23');
  f.controls.select(first);
  expect(f.count()).toBe('12');
});

it('keeps an in-flight vote with its original photograph and prevents stale GET rollback', async () => {
  const f = pendingVote();
  f.controls.select(second);
  expect(f.button().disabled).toBe(false);
  f.controls.select(first);
  expect(f.button().disabled).toBe(true);
  f.button().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(f.fetcher).toHaveBeenCalledTimes(2);
  f.controls.select(second);
  f.vote.resolve(Response.json({ count: 8 }));
  await vi.waitFor(() => expect(f.button().disabled).toBe(false));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.status.textContent).toBe('');
  expect(f.count()).toBe('—');
  f.load.resolve(Response.json({ [first]: 1, [second]: 4 }));
  await vi.waitFor(() => expect(f.count()).toBe('4'));
  f.controls.select(first);
  expect(f.count()).toBe('8');
  expect(f.button().getAttribute('aria-pressed')).toBe('true');
});

it('announces current load failures without inventing zero or accepting stale failure feedback', async () => {
  const f = fixture();
  const old = Promise.withResolvers<Response>();
  f.fetcher.mockReturnValueOnce(old.promise).mockResolvedValueOnce(Response.json({ [first]: 7 }));
  f.controls.select(first);
  f.resume(true);
  await vi.waitFor(() => expect(f.count()).toBe('7'));
  old.reject(new Error('old offline response'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.status.textContent).toBe('');
  f.fetcher.mockRejectedValueOnce(new Error('offline'));
  f.resume(true);
  await vi.waitFor(() =>
    expect(f.status.textContent).toBe('Photo reaction counts are temporarily unavailable.'),
  );
  expect(f.count()).toBe('7');
});

it('accepts newer shared totals after a local vote and never rolls them back for a late POST', async () => {
  const f = fixture();
  const vote = Promise.withResolvers<Response>();
  f.fetcher.mockResolvedValueOnce(Response.json({ [first]: 5 }));
  f.controls.select(first);
  await vi.waitFor(() => expect(f.count()).toBe('5'));
  f.fetcher.mockReturnValueOnce(vote.promise).mockResolvedValueOnce(Response.json({ [first]: 9 }));
  f.button().click();
  f.resume(true);
  await vi.waitFor(() => expect(f.count()).toBe('9'));
  vote.resolve(Response.json({ count: 6 }));
  await vi.waitFor(() =>
    expect(f.status.textContent).toBe('Reaction added. It stays with this photo.'),
  );
  expect(f.count()).toBe('9');
  expect(f.button().getAttribute('aria-pressed')).toBe('true');
  f.fetcher.mockResolvedValueOnce(Response.json({ [first]: 12 }));
  f.resume(true);
  await vi.waitFor(() => expect(f.count()).toBe('12'));
});

it('reports duplicate, failed, and identity-storage outcomes without changing confirmed totals', async () => {
  const raw = consentingStorage({ 'daysforth.visitor': identity });
  const f = fixture('https://api.test', raw);
  f.fetcher.mockResolvedValueOnce(Response.json({ [first]: 3 }));
  f.controls.select(first);
  await vi.waitFor(() => expect(f.count()).toBe('3'));
  raw.setItem('daysforth.reacted.photo-margot-1', 'true');
  f.button().click();
  await vi.waitFor(() => expect(f.status.textContent).toBe('You’ve already added this reaction.'));
  clearPreferences(raw);
  document.dispatchEvent(new CustomEvent('daysforth:storage'));
  const write = vi.spyOn(raw, 'setItem').mockImplementation(() => {
    throw new Error('full');
  });
  f.button().click();
  await vi.waitFor(() =>
    expect(f.status.textContent).toContain('couldn’t retain the reaction identity'),
  );
  write.mockRestore();
  f.fetcher.mockRejectedValueOnce(new Error('POST offline'));
  f.button().click();
  await vi.waitFor(() =>
    expect(f.status.textContent).toBe('Your reaction couldn’t be saved. Please try again.'),
  );
  expect(f.count()).toBe('3');
  expect(f.button().disabled).toBe(false);
});

it('keeps unconfigured controls unavailable and detaches event handlers on teardown', () => {
  const f = fixture('');
  f.controls.select(first);
  expect(f.count()).toBe('—');
  expect(f.status.textContent).toBe('Photo reactions are temporarily unavailable.');
  expect(f.button().disabled).toBe(true);
  f.button().click();
  const root = f.dialog.querySelector('[data-photo-reactions]')!;
  root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const text = document.createTextNode('Unrelated');
  root.append(text);
  text.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  f.resume(true);
  expect(f.fetcher).not.toHaveBeenCalled();
  f.controls.destroy();
  f.button().disabled = false;
  f.button().click();
  document.dispatchEvent(new CustomEvent('daysforth:storage'));
  f.resume(true);
  expect(f.button().disabled).toBe(false);
  expect(f.fetcher).not.toHaveBeenCalled();
});

it('does not update detached controls when a GET or mutation completes after disposal', async () => {
  const f = pendingVote();
  f.controls.destroy();
  const before = f.dialog.innerHTML;
  f.vote.resolve(Response.json({ count: 4 }));
  f.load.reject(new Error('offline after destroy'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.dialog.innerHTML).toBe(before);
});

it('discards a successful GET that finishes after the controls have been destroyed', async () => {
  const f = fixture();
  const response = Promise.withResolvers<Response>();
  f.fetcher.mockReturnValueOnce(response.promise);
  f.controls.select(first);
  f.controls.destroy();
  const unchanged = f.dialog.innerHTML;
  response.resolve(Response.json({ [first]: 99 }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(f.dialog.innerHTML).toBe(unchanged);
});
