<!--
Purpose: Record the evidence-based architecture and lifecycle audit informing version 1.1.1.
Scope: Inspected boundaries, five corrected defects, focused evidence, and deferred growth triggers.
Does NOT belong: Production verification, release approval, or speculative redesign requirements.
Copyright (c) 2026 William Carson McRae. All rights reserved.
SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
-->

# Architecture and lifecycle audit for 1.1.1

Reviewed November 5, 2026. The review began against published commit
`2ecbd1771dae8cc13707ea247060cf3b7acc15b7` and then checked the authorized fixes below.
Concurrent presentation, content, screen-gallery and page-shortcut changes have their own owner
reviews and require the integrated release checks. This record does not claim those checks ran.

## Inspected scope and limits

The review inspected the repository instructions and governance, architecture overview and
maintenance rules, content ownership, runtime modules and related tests. It followed the browser
composition roots through timeline state/rendering, history restoration, lazy controls, menus,
photo viewing, reactions, consent and storage. It also inspected Astro components, page/endpoint
composition, asset lookup and rendering, metadata serialization, build configuration, image CLI
planning, repository/release/dependency gates, Worker configuration and adapter, HTTP service,
database migrations, SQLite test support, and GitHub quality/deployment/release workflows.

This was a source-and-test audit, not a claim of line-by-line examination of every asset or test.
Small reproductions used only in-memory DOM, image buffers and SQLite. No production requests,
provider dashboards, credentials, private originals or live database contents were used. No full
suite, build, security scan or deployment ran as part of this audit. Manual screen-reader and
production configuration verification remain outside its evidence.

## Assessment

The current architecture fits a static personal website. Static HTML keeps reading independent
of optional JavaScript and the reaction service. Content, browser behavior, static build tools
and the separately deployed Worker have distinct responsibilities and an executable import-boundary
gate. Client identity and preferences stay behind consent-aware storage; the Worker receives only
its narrow reaction contract and keeps secrets in its environment.

No broad rewrite or god-object split is justified. The timeline controller owns one browsing
lifecycle and delegates dates, pure filtering/grouping, rendering and restoration. The viewer
delegates album resolution, filmstrip interaction and reaction presentation. The service separates
HTTP validation, mutation and cleanup, while CLI adapters delegate planning and policy. Their
size and fan-out reflect composition responsibilities rather than unrelated product ownership.
Splitting those coordinators merely to reduce line counts would add interfaces without correcting
the observed defects. The useful changes were specific state, measurement and codec boundaries.

## Corrected findings

All five findings were medium priority: observable correctness or privacy-control defects without
evidence of credential exposure or a need to change the deployment model.

### 1. Forget used the wrong storage tier and depended on network completion

In `privacy-controls.ts`, erasure originally read the raw localStorage visitor while memory-only
reactions used `preferenceStorage`. An in-memory reproduction found zero DELETE requests for an
existing session identity, followed by successful browser-cleared feedback. The same path awaited
remote deletion before clearing local choices, so a hanging request could indefinitely delay the
local action.

The control now captures the existing consent-aware identifier without generating one, clears
browser preferences and notifies adapters immediately, and bounds best-effort deletion to five
seconds. Disposal aborts pending erasure and prevents late feedback changes. Tests cover undecided
and declined storage, persisted identities, rejected/offline requests, the deadline boundary and
disposal. The necessary consent record and permanent counts retain their existing semantics.

### 2. Late post reactions restored forgotten selection or updated disposed UI

`reaction-controller.ts` already avoided restoring a forgotten identifier after a pending vote.
`post-action-events.ts` nevertheless selected its button and announced success unconditionally.
The reproduction cleared preferences during a POST: selection became false, then the old response
changed it to true and disabled the button even though the remembered visitor remained absent.

The post adapter now checks liveness and the current identity/remembered choice before presenting
results. A confirmed server count still updates the active document's aggregate display; an old
identity does not restore selection or announce stale success/failure. A disposed adapter does not
update its DOM or notices. Regressions cover successful and failed responses after Forget and
disposal, alongside ordinary success and pending-request deduplication. Repeated pending-request
setup lives in the existing test fixture rather than copied test blocks.

### 3. Initial filmstrip centering measured a hidden dialog

`photo-viewer.ts` called filmstrip construction and painting before `dialog.showModal()`. Both
initial measurements therefore occurred while the native closed dialog had no rendered geometry;
there was no post-open centering pass. Opening a later photo could leave its current thumbnail
outside a narrow strip.

The viewer now opens before constructing and centering a fresh strip. A geometry-sensitive unit
regression exposes zero dimensions while closed and real dimensions while open, then verifies one
correct centering call for the third photo, unchanged page position and restored trigger focus.
Existing navigation tests preserve subsequent thumbnail and keyboard behavior. A standalone native
browser diagnostic could not launch from the sandbox's default Playwright cache; that attempt is
not browser verification. Integrated browser verification belongs to the release QA record.

### 4. Loaded photo enhancement intercepted modified native links

The lazy loader preserved Ctrl/Meta/Shift/Alt and non-primary clicks, but the loaded viewer's
document listener did not. A current-code DOM reproduction of Ctrl-click returned
`defaultPrevented: true` and opened the dialog. Native behavior therefore changed after the first
ordinary photo interaction.

`click-intent.ts` now owns the existing primary-unmodified-control resolver, shared by the loader
and viewer. Regression tests verify that modified clicks remain uncancelled with the dialog
closed, while an ordinary click still opens it. Existing deferred-control tests exercise all
modifier and unrelated-target paths. No navigation or new persistence behavior was introduced.

### 5. Import sizing ignored EXIF-oriented dimensions

`scripts/import-photos.ts` read metadata after queuing rotation, but Sharp's stored pixel dimensions
still described the unrotated input. A real in-memory EXIF-6 JPEG reported 3000 by 2000 pixels;
upright dimensions were 2000 by 3000, while the old resize plan produced 2000 by 1333. Resizing to
both original-axis dimensions after rotation cropped the portrait into a landscape result.

Import planning now uses the pinned codec's `metadata.autoOrient` dimensions. CLI composition tests
assert the corrected plan, and real-buffer tests check ordinary and rotated orientations,
upright proportions, output dimensions and stripped orientation/EXIF metadata. No original or
existing imported photo was modified or reimported.

## Focused verification

The assigned regression scope passed 111 tests in 11 files. All six changed executable files
had 100% statements, branches, functions and lines: `click-intent.ts`, `deferred-controls.ts`,
`privacy-controls.ts`, `post-action-events.ts`, `photo-viewer.ts`, and `scripts/import-photos.ts`.
The measured totals were 341 statements, 185 branches, 45 functions and 296 lines. Targeted ESLint,
Prettier and diff-whitespace checks passed. These results do not replace the full release gates.
After consolidating the pending-vote fixture, a focused clone check across the 12 owned executable
and test files reported zero duplicated lines or tokens. The full-repository duplicate gate remains
part of integrated validation.

## Accepted performance follow-ups

The generated date-position stylesheet contains only `.date-rail__label--*` selectors, consumed
by the homepage's DateRail. PostLocation uses a native range and datalist rather than those classes.
The generated media-frame stylesheet contains only `.post-media__frame` rules; actual consumers
are Home, Work and Life. Omitting those blocking stylesheet links elsewhere was accepted and is
implemented by the shell owner, with route/build verification required during release QA.

The shared MomentImage declaration also advertised 800-pixel desktop slots for much smaller
profile/feed images. In the inspected pre-change build, portrait candidates were 9,306 bytes at
320 pixels and 22,164 bytes at 600 pixels, while the desktop portrait was 144 CSS pixels wide.
The profile now declares its actual responsive slot through the existing image components.
All twelve mobile/desktop DPR 1/2 checks selected 160-pixel/3,416-byte or 320-pixel/9,306-byte
candidates while preserving the 72/144 CSS-pixel layout and separate large-image link. Broader
feed sizing should still be measured across both browsing presentations before changing it.

## Deferred triggers, not required refactors

- **Retention-table growth:** hourly `DELETE FROM reactions WHERE created_at <= ?` has no matching
  timestamp index. Running `EXPLAIN QUERY PLAN` against all actual migrations returned
  `SCAN reactions`. This is evidence of scaling behavior, not evidence that current production
  volume is problematic. If retained volume or measured D1 read cost warrants it, add a compatible
  timestamp index and verify indexed cleanup, the retention boundary and unchanged aggregates.
- **Measured scroll cost:** the desktop navigator reads card geometry and rewrites current-state
  attributes on every scroll callback. The present small timeline does not establish a latency
  defect. If profiling shows cost, coalesce work per animation frame and avoid attribute writes
  when the active card is unchanged; preserve focus, filtering and shortcut behavior.
- **Retired content identities:** keep published image reaction IDs accepted when presentation
  changes, just as retired moments retain aliases. Before the first image retirement, verify the
  retained allowlist and permanent totals explicitly; do not silently drop keys derived from old
  presentation data. New keys still require a compatible Worker deployment before the site.

## Worker, privacy and remote-erasure boundary

Source inspection found bound SQL, approved keys, bounded request bodies, salted identifiers,
independent erasure quotas and aggregate-preserving deletion intact. Worker request logging is
disabled in configuration; this is not proof of provider-side retention or live settings. Origin
checks are browser controls, not authentication. The public source and endpoint are not secrets;
the salt and database binding remain private deployment configuration.

Remote erasure is not atomic with an already-issued vote. A concurrent POST can commit its old
identifier after DELETE has completed. These client fixes clear local state promptly and prevent
stale UI restoration; they do not cancel a request already accepted by the service or coordinate
POST/DELETE ordering. Such identifiers remain subject to the existing retention cleanup, and
aggregate counts remain permanent. No broad request coordinator or stronger erasure guarantee
was introduced. A stronger guarantee would require a separately reviewed protocol/lifecycle change.

Keep this record with [the overview](overview.md), [the earlier review](review.md), and
[maintenance rules](maintenance.md). Integrated results and publication status belong to the
version 1.1.1 release/QA record.
