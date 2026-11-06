/**
 * Purpose: Let visitors grant, withdraw, and erase optional browser persistence.
 * Scope: Accessible consent UI, preference clearing, and removal of the pseudonymous reaction identifier.
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
  if (typeof dialog.showModal !== 'function') throw new Error('Storage dialog unavailable');
  const notice = doc.querySelector<HTMLElement>('[data-storage-notice]')!;
  const storage = safeStorage(win);
  const preferences = preferenceStorage(win);
  const pending = new Set<AbortController>();
  let alive = true;
  let forgetting = false;
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
    const cleared = allowed || clearPreferences(storage as Storage | null);
    const recorded = recordConsent(storage, allowed);
    sync();
    doc.dispatchEvent(new CustomEvent('daysforth:storage'));
    if (!recorded || !cleared) {
      if (!dialog.open) dialog.showModal();
      feedback.textContent = cleared
        ? 'This browser could not remember your choice.'
        : 'Optional storage is off for this page. Some saved browser data could not be removed.';
      return;
    }
    dialog.close();
  };
  const removeIdentity = async (visitorId: string | null) => {
    if (!visitorId) return true;
    if (!endpoint) return false;
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
      const acknowledged = request.then(async (response) => {
        if (!response.ok) return false;
        const value: unknown = await response.json();
        return (
          value !== null &&
          typeof value === 'object' &&
          'forgotten' in value &&
          value.forgotten === true
        );
      });
      return await Promise.race([acknowledged, deadline]);
    } catch {
      return false;
    } finally {
      globalThis.clearTimeout(timer);
      pending.delete(controller);
    }
  };
  const forgetBrowser = async () => {
    if (forgetting) return;
    forgetting = true;
    const visitorId = readItem(preferences, 'daysforth.visitor');
    const cleared = clearPreferences(storage as Storage | null);
    const recorded = recordConsent(storage, false);
    sync();
    doc.dispatchEvent(new CustomEvent('daysforth:storage'));
    feedback.textContent =
      cleared && recorded
        ? 'Browser data cleared. Checking server identifier removal…'
        : 'Some saved browser data could not be removed or the choice could not be remembered. Checking server identifier removal…';
    const removed = await removeIdentity(visitorId);
    forgetting = false;
    if (!alive) return;
    if (!cleared || !recorded) {
      feedback.textContent =
        'Optional storage is off for this page. Some saved browser data could not be removed or the choice could not be remembered.';
      return;
    }
    feedback.textContent = removed
      ? 'Saved browser data cleared. Reaction counts stay.'
      : 'Browser data cleared. Server identifier removal could not be confirmed; any remaining identifier becomes eligible for cleanup after 90 days.';
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
    if (dialog.open) dialog.close();
    for (const controller of pending) controller.abort();
    doc.removeEventListener('click', onClick);
    doc.removeEventListener('daysforth:privacy-request', request);
  };
}
