/**
 * Purpose: Publish nonpersonal static build attribution for operational verification.
 * Scope: Product version and explicitly supplied public source commit, generated at build time.
 * Does NOT belong: A live service health assertion, private configuration, or visitor telemetry.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { buildIdentity } from '../lib/build-identity';

export const GET = () => Response.json(buildIdentity(process.env['SOURCE_COMMIT']));
