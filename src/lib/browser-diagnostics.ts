/**
 * Purpose: Make optional enhancement failures diagnosable without collecting visitor data.
 * Scope: Isolated mounts, commands, cleanup, and bounded warnings with stable codes/components/releases.
 * Constraints: Never log error objects, URLs, preferences, identifiers, or personal content.
 * Does NOT belong: Remote telemetry, provider logging, or user-facing recovery.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { releaseVersion } from './release-identity';

export type BrowserComponent =
  | 'photo'
  | 'privacy'
  | 'menu'
  | 'post-actions'
  | 'optional'
  | 'theme'
  | 'history'
  | 'navigation'
  | 'timeline'
  | 'images';
type FailureCategory = 'load' | 'activation' | 'initialization' | 'cleanup';
const reported = new WeakMap<Document, Set<string>>();

export function reportBrowserFailure(
  doc: Document,
  component: BrowserComponent,
  category: FailureCategory,
) {
  try {
    const codes = reported.get(doc) ?? new Set<string>();
    const code = `DF_ENHANCEMENT_${category.toUpperCase()}`;
    const key = `${component}:${code}`;
    if (codes.has(key) || codes.size >= 8) return;
    codes.add(key);
    reported.set(doc, codes);
    console.warn('[Daysforth]', { code, component, category, release: releaseVersion });
  } catch {
    // Diagnostics must never interrupt reading or the recovery path.
  }
}

export function runBrowserCommand(
  doc: Document,
  component: BrowserComponent,
  command: () => void | Promise<void>,
) {
  try {
    const result = command();
    if (result) void result.catch(() => reportBrowserFailure(doc, component, 'activation'));
  } catch {
    reportBrowserFailure(doc, component, 'activation');
  }
}

export function startBrowserFeature(
  doc: Document,
  component: BrowserComponent,
  initialize: () => void | (() => void),
): () => void {
  let cleanup: void | (() => void);
  let active = true;
  try {
    cleanup = initialize();
  } catch {
    reportBrowserFailure(doc, component, 'initialization');
  }
  return () => {
    if (!active) return;
    active = false;
    try {
      cleanup?.();
    } catch {
      reportBrowserFailure(doc, component, 'cleanup');
    }
  };
}
