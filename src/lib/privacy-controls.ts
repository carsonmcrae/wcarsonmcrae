/**
 * Purpose: Let visitors grant, withdraw, and erase optional browser persistence.
 * Scope: Accessible consent UI, preference clearing, and removal of the anonymous server identifier.
 * Does NOT belong: Permanent aggregate reaction removal or provider policies.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clearPreferences, consentChoice, preferenceStorage, recordConsent } from './consent';
import { readItem, safeStorage } from './storage';
export function initPrivacyControls(
  doc: Document,
  win: Pick<Window, 'localStorage' | 'fetch'>,
  endpoint: string,
) {
  const dialog = doc.querySelector<HTMLDialogElement>('[data-storage-dialog]')!;
  const notice = doc.querySelector<HTMLElement>('[data-storage-notice]')!;
  const storage = safeStorage(win);
  const preferences = preferenceStorage(win);
  const pending = new Set<AbortController>();
  let alive = true;
  const feedback = dialog.querySelector<HTMLElement>('[data-storage-feedback]')!;
  const sync = () => {
    const choice = consentChoice(storage);
    notice.hidden = choice !== null;
    dialog.querySelector('[data-storage-status]')!.textContent =
      choice === true ? 'Optional storage is on.' : 'Optional storage is off.';
  };
  const request = () => {
    sync();
    dialog.showModal();
  };
  const chooseStorage = (allowed: boolean) => {
    if (!allowed) clearPreferences(storage as Storage | null);
    if (!recordConsent(storage, allowed)) {
      if (!dialog.open) dialog.showModal();
      feedback.textContent = 'This browser could not remember your choice.';
      return;
    }
    sync();
    dialog.close();
    doc.dispatchEvent(new CustomEvent('daysforth:storage'));
  };
  const removeIdentity = async (visitorId: string | null) => {
    if (!visitorId || !endpoint) return true;
    const controller = new AbortController();
    pending.add(controller);
    let timer!: ReturnType<typeof globalThis.setTimeout>;
    const deadline = new Promise<false>((resolve) => {
      timer = globalThis.setTimeout(() => {
        controller.abort();
        resolve(false);
      }, 5000);
    });
    try {
      const request = win.fetch(`${endpoint}/identity`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        signal: controller.signal,
      });
      return await Promise.race([request.then((response) => response.ok), deadline]);
    } catch {
      return false;
    } finally {
      globalThis.clearTimeout(timer);
      pending.delete(controller);
    }
  };
  const forgetBrowser = async () => {
    const visitorId = readItem(preferences, 'daysforth.visitor');
    clearPreferences(storage as Storage | null);
    recordConsent(storage, false);
    sync();
    doc.dispatchEvent(new CustomEvent('daysforth:storage'));
    feedback.textContent = 'Browser data cleared. Checking server identifier removal…';
    const removed = await removeIdentity(visitorId);
    if (!alive) return;
    feedback.textContent = removed
      ? 'Saved browser data cleared. Reaction counts stay.'
      : 'Browser data cleared. The server identifier could not be removed now; it becomes eligible for automatic cleanup after 90 days.';
  };
  const onClick = async (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>('button');
    if (!target) return;
    if (target.dataset['storageOpen'] !== undefined) request();
    if (target.dataset['storageClose'] !== undefined) dialog.close();
    if (target.dataset['storageChoice'] !== undefined)
      chooseStorage(target.dataset['storageChoice'] === 'yes');
    if (target.dataset['forgetBrowser'] !== undefined) await forgetBrowser();
  };
  doc.addEventListener('click', onClick);
  doc.addEventListener('daysforth:privacy-request', request);
  sync();
  return () => {
    alive = false;
    for (const controller of pending) controller.abort();
    doc.removeEventListener('click', onClick);
    doc.removeEventListener('daysforth:privacy-request', request);
  };
}
