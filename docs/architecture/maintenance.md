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

## Evidence to record

For each consequential change, identify the affected source paths, the old and new boundary,
whether browser/server state changes, migration or backwards-compatibility needs, and how it was
verified. Document residual uncertainty. Keep private infrastructure details and credentials out of
these public records. Routine copy edits and tests do not need a new decision document.

## Current release changes

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
