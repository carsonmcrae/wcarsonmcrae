/**
 * Purpose: Enforce reviewable versions, visitor release notes, and architectural maintenance.
 * Scope: Pure validation of manifest/lock versions, release history, tags, and changes from a base.
 * Does NOT belong: Reading Git, choosing a version, or publishing a release.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { isTimelineDate } from '../../src/lib/timeline-dates.ts';

interface Release {
  version: string;
  date?: string;
  title: string;
  summary: string;
  sections: readonly { id: string; title: string; items: readonly string[] }[];
}
interface ReleaseInput {
  version: string;
  lockVersion: string;
  lockPackageVersion: string;
  releases: readonly Release[];
  tag?: string;
  baseVersion?: string;
  changes: { status: string; path: string }[];
}
const STABLE = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

function compare(left: string, right: string): number {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = a[index]! - b[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

function checkSection(
  section: Release['sections'][number],
  version: string,
  ids: Set<string>,
): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z\d-]*$/.test(section.id) || ids.has(section.id))
    errors.push(`Release ${version} needs unique, URL-safe section IDs.`);
  ids.add(section.id);
  if (
    !section.title.trim() ||
    section.items.length === 0 ||
    section.items.some((item) => !item.trim())
  )
    errors.push(`Release ${version} contains an empty change section.`);
  return errors;
}

function checkHistory(releases: readonly Release[]): string[] {
  const errors: string[] = [];
  for (const [index, release] of releases.entries()) {
    if (!STABLE.test(release.version)) errors.push(`Invalid release version: ${release.version}.`);
    if (release.date?.length !== 10 || !isTimelineDate(release.date))
      errors.push(`Release ${release.version} needs a real YYYY-MM-DD calendar date.`);
    const previous = releases[index - 1];
    if (previous && compare(previous.version, release.version) <= 0)
      errors.push('Release history must be unique and newest first.');
    if (!release.title.trim() || !release.summary.trim() || release.sections.length === 0)
      errors.push(`Release ${release.version} needs a title, summary, and change sections.`);
    const ids = new Set<string>();
    for (const section of release.sections)
      errors.push(...checkSection(section, release.version, ids));
  }
  return errors;
}

function checkComparison(input: ReleaseInput): string[] {
  if (input.baseVersion === undefined) return [];
  if (!STABLE.test(input.baseVersion)) return ['The comparison base must have a stable version.'];
  const errors: string[] = [];
  const difference = compare(input.version, input.baseVersion);
  if (difference < 0) errors.push('The product version cannot move backwards.');
  const productChanged = input.changes.some(({ path }) =>
    /^(?:src\/|public\/|workers\/|astro\.config\.mjs$|package(?:-lock)?\.json$)/.test(path),
  );
  if (productChanged && difference === 0)
    errors.push('Product changes require a version increase and matching public release notes.');
  return errors;
}

function checkArchitecture(changes: ReleaseInput['changes']): string[] {
  const architectureChanged = changes.some(
    ({ status, path }) =>
      /^(?:astro\.config\.mjs$|package\.json$|workers\/|src\/layouts\/|src\/lib\/reaction-service\.ts$)/.test(
        path,
      ) ||
      (/^[AD]/.test(status) && /^src\/(?:lib|components|pages|data)\//.test(path)),
  );
  const documented = changes.some(
    ({ status, path }) => status !== 'D' && /^docs\/architecture\/.+\.md$/.test(path),
  );
  return architectureChanged && !documented
    ? ['Boundary changes require a reviewed update under docs/architecture/.']
    : [];
}

export function checkReleasePolicy(input: ReleaseInput): string[] {
  const errors: string[] = [];
  if (!STABLE.test(input.version)) errors.push('package.json must use a stable MAJOR.MINOR.PATCH.');
  if (input.lockVersion !== input.version || input.lockPackageVersion !== input.version)
    errors.push('Both package-lock.json versions must match package.json.');
  if (input.releases[0]?.version !== input.version)
    errors.push('The newest public release notes must match package.json.');
  errors.push(...checkHistory(input.releases));
  if (input.tag !== undefined && input.tag !== `v${input.version}`)
    errors.push(`Release tag must be v${input.version}.`);
  return [...errors, ...checkComparison(input), ...checkArchitecture(input.changes)];
}
