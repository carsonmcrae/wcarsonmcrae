# Maintaining the architecture

Update this directory in the same change that modifies a system boundary. Explain the resulting
design, ownership, data flow, and tradeoff; a date-only edit is not a useful architecture update.
Keep [overview.md](overview.md) current and resolve or update [review.md](review.md) findings when
the evidence changes. Add a short decision document here when a consequential alternative is chosen.

## Update triggers

- A route, data module, component, or logic module is added or removed.
- Dependencies, Astro/build configuration, the page shell, Worker code/configuration, or the
  reaction storage/service contract changes.
- A new external service, persistent field, consent behavior, network request, trust boundary,
  deployment unit, or public wire contract is introduced.
- A previous decision or documented limitation no longer matches the source.

The `check:release` gate uses a supplied `RELEASE_BASE_SHA` to enforce a Markdown change in this
directory for added/deleted source boundary files, changes to `package.json`, `astro.config.mjs`,
`src/layouts/`, `workers/`, or `src/lib/reaction-service.ts`. This is a review reminder, not semantic
proof that documentation is correct. It does not detect every behavior/import change. Reviewers
must apply all triggers above, including changes within an existing file.

The browser CI job selects Ubuntu's official HTTPS archive ahead of the runner's slow Azure mirror.
Only the runner's mirror URL changes: distribution suites, archive trust anchors, package-signature
verification, Playwright versions, and application checks remain intact. This applies to the shared
quality gate used by pull requests and Pages deployment; it adds no browser-facing service.

## Evidence to record

For each consequential change, identify the affected source paths, the old and new boundary,
whether browser/server state changes, migration or backwards-compatibility needs, and how it was
verified. Document residual uncertainty. Keep private infrastructure details and credentials out of
these public records. Routine copy edits and tests do not need a new decision document.

## Current release changes

Version 1.1.0 separates photo-viewer lifecycle, native filmstrip navigation, and the photo reaction
DOM adapter. Both photo and moment adapters use the shared reaction-only controller. Stable
`photo-`/`screen-` asset identities extend the approved Worker allowlist without changing existing
moment keys, database schema, secrets, or permanent totals. Deploy this compatible Worker addition
before the corresponding site. Reactions keep the same consent-gated preferences and shared abuse
allowance; family albums add approved content, not a new storage purpose or external service.

Release records now carry explicit calendar dates rendered consistently on index/detail pages.
The format gate checks valid full dates, and content-review policy preserves historical dates.
Authored release records live in scanned `release-history.json`; `releases.ts` is only a typed
readonly adapter plus the canonical package version. Keep content separate from executable policy:
the JSON owns no logic, and `release-policy.ts` still validates every record and date. This boundary
preserves all historical output without excluding content or relaxing coverage/duplication checks.
Header container layout and dock-aware shortcut placement remain transient presentation state.

Two delayed-interaction races also receive explicit ownership. The deferred post-action loader
delivers the original control to semantic `activate`, so it neither emits an outside click into a
newly opened menu nor loses a command when Saved filtering detaches the card. Destroyed documents
cancel pending delivery; no cross-page Save queue is introduced. Timeline entries claim manual
scroll restoration before departure. Navigation API non-replacement events snapshot the current
entry with `updateCurrentEntry`; restore reads prefer `getState()` over the classic explicit-click
history fallback. The early bootstrap recognizes valid native positions without a date query, and
timeline initialization shares the accessor. The navigation callback never calls `history.replaceState`, and no `pagehide`
listener writes history. Browsers without that API retain their last explicit link/history-button
snapshot, without a new guarantee for later toolbar-only positions. Ordinary post pages keep native
automatic restoration. This preserves the existing browser-history purpose and adds no optional
persistence, service request, Worker change or private server browsing profile.

Version 1.0.1 changes album presentation from long page grids to compact entries and a grouped
carousel in the shared native photo viewer. The viewer continues to load on intent, keeps its
selection in memory, and retains ordinary original-photo links without JavaScript. No service,
storage, consent, reaction key, or Worker deployment contract changes. Timeline shortcut/reveal
state is scoped to the current document; category chips and filter options share their presentation
mapping instead of maintaining separate icon identities.

Version 1.0.0 adds a public release index and permanent version pages, reading one canonical
package version and one history data source. Privacy policy copy remains centralized while its page
now has a contents navigation and measured sections that reflow into one column. These are static
routes using the existing shell, CSP, and consent controls; they introduce no external service or
new visitor storage.

The static `media-frames.css` endpoint derives cover ratios from existing image metadata. This keeps
lazy decoding out of the timeline-position contract rather than coupling the controller to image
events. Its generator is build-only, and its endpoint has the same ordinary static delivery boundary
as the icon/position stylesheets. Update the dependency gate if its capabilities or consumers change.

The responsibility audit also adds a repository dependency gate for the existing browser, static
build, Worker, and CLI boundaries. This changes review enforcement, not visitor state or the public
reaction wire contract. Keep the graph scanner and its adversarial fixtures current when adding
entry-point forms or changing module resolution. The public Worker remains a separate deployment
unit; its secret, binding, quota, and persistent aggregate boundaries remain unchanged.

Every release still needs the checks in [repository rules](../governance/repository-rules.md),
the explicit manual accessibility record, and the [release process](../governance/releases.md).
