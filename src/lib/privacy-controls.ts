/**
 * Purpose: Let visitors grant, withdraw, and erase optional browser persistence.
 * Scope: Accessible consent UI, preference clearing, and removal of the anonymous server identifier.
 * Does NOT belong: Permanent aggregate reaction removal or provider policies.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { clearPreferences, consentChoice, recordConsent } from './consent';
import { readItem, safeStorage } from './storage';
export function initPrivacyControls(
  doc: Document,
  win: Pick<Window, 'localStorage' | 'fetch'>,
  endpoint: string,
) {
  const dialog = doc.querySelector<HTMLDialogElement>('[data-storage-dialog]')!;
  const notice = doc.querySelector<HTMLElement>('[data-storage-notice]')!;
  const storage = safeStorage(win);
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
  const removeIdentity = async () => {
    const visitorId = readItem(storage, 'daysforth.visitor');
    if (!visitorId || !endpoint) return true;
    try {
      const response = await win.fetch(`${endpoint}/identity`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };
  const forgetBrowser = async () => {
    const removed = await removeIdentity();
    clearPreferences(storage as Storage | null);
    recordConsent(storage, false);
    sync();
    doc.dispatchEvent(new CustomEvent('daysforth:storage'));
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
    doc.removeEventListener('click', onClick);
    doc.removeEventListener('daysforth:privacy-request', request);
  };
}
