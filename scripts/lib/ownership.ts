/**
 * Purpose: Preserve first-party ownership notices as the repository evolves.
 * Scope: SPDX/copyright validation in existing source headers; non-commentable files use COPYRIGHT.md.
 * Does NOT belong: Replacing third-party licenses, modifying files, or deciding legal enforceability.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { commentStyleFor, extractHeader } from './file-headers.ts';
import type { FileText, GateReport } from './file-lines.ts';

export const OWNERSHIP_NOTICE = 'Copyright (c) 2026 William Carson McRae. All rights reserved.';
export const OWNERSHIP_LICENSE = 'SPDX-License-Identifier: LicenseRef-Daysforth-Restricted';

export function checkOwnership(files: FileText[]): GateReport {
  const report: GateReport = { checked: 0, errors: [], warnings: [] };
  for (const file of files) {
    const style = commentStyleFor(file.path);
    if (style === null) continue;
    report.checked++;
    const header = extractHeader(file.text, style) ?? '';
    if (!header.includes(OWNERSHIP_NOTICE) || !header.includes(OWNERSHIP_LICENSE))
      report.errors.push(`${file.path}: preserve the copyright and restricted-use SPDX header.`);
  }
  return report;
}
