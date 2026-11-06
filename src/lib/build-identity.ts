/**
 * Purpose: Attribute a static publication to its release and reviewed source.
 * Scope: Validate the optional public Git commit without exposing build environment contents.
 * Does NOT belong: Deployment status, credentials, visitor data, or runtime tracking.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { releaseVersion } from './release-identity';

export function buildIdentity(commit: string | undefined) {
  if (commit !== undefined && !/^[a-f\d]{40}$/i.test(commit))
    throw new Error('SOURCE_COMMIT must be a full Git commit SHA.');
  return { version: releaseVersion, source: commit?.toLowerCase() ?? 'local' };
}
