/**
 * Purpose: Expose typed visitor release history and the canonical current product version.
 * Scope: Readonly record/section contracts for authored JSON content and the package version.
 * Does NOT belong: Release copy (release-history.json), validation policy, or publication automation.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import manifest from '../../package.json' with { type: 'json' };
import history from './release-history.json' with { type: 'json' };

interface ReleaseSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly string[];
}
interface ReleaseRecord {
  readonly version: string;
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly ReleaseSection[];
}

export const currentVersion = manifest.version;
export const releases: readonly ReleaseRecord[] = history;
