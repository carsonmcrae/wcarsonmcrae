# Architecture review for 1.0.0

Reviewed November 5, 2026 against the source tree. This review covers separation of responsibilities,
deployment boundaries, state ownership, change safety, and growth pressure. It is a source review,
not a penetration test, live infrastructure audit, or accessibility certification.

## Assessment

The architecture fits a personal timeline. Static generation keeps ordinary reading independent of
the reaction service. Confirmed content is centralized; a small tested model drives both static
and enhanced browsing. Progressive enhancement, strict CSP, base-path verification, and built-page
budgets are useful constraints that should survive future growth. Adding a general application
server, account platform, CMS, or state framework is not justified by the present requirements.

An additional responsibility audit of `src/lib`, `scripts/lib`, and the Worker found no current
god object requiring a broad rewrite. The largest runtime modules are the reaction service and
timeline controller, both below 300 physical lines. The controller owns one browsing lifecycle and
delegates dates, filtering/grouping, rendering, and history restoration. The service now separates
HTTP context, route/method validation, bounded identity parsing, count reads, and mutation work;
its parameterized SQL and error contracts remain covered by real SQLite tests. CLI entry points
delegate policy to small tested modules; the Worker entry remains a binding/allowlist adapter.
Splitting these files merely to reduce line counts would fragment coherent responsibilities.

A read-only runtime import audit covered 72 first-party TypeScript/JavaScript modules and 74
resolved internal edges, excluding erased type imports, and found no runtime cycles. Direct fan-out
was highest at the browser composition root (12, including deferred controls), the repository CLI
(7), and the post-action hydrator and timeline entry (6 each). The highest fan-in was storage (7)
and consent (5), narrow persistence primitives rather than owners of unrelated features. The Worker
adapter had four dependencies for content keys, aliases, key construction, and service dispatch;
the service itself had no first-party runtime imports. These measurements support the responsibility
assessment; they are evidence from this review, not new blanket dependency-count limits.

The recurring risk was a shared folder containing browser and Worker libraries without an import
boundary gate. `scripts/lib/dependency-boundaries.ts` now makes that documented constraint executable
through `check:repo`. Regression fixtures exercise transitive and deferred imports, re-exports,
cycles, erased types, Astro browser script roots, Node/build capabilities, explicit DOM access, and
upward dependencies on executable adapters. Existing line limits, duplication checks, per-file
coverage, and ESLint complexity/depth constraints remain complementary growth controls.

## Decisions to preserve

- **Static-first pages:** ordinary links and server-rendered content remain the fallback. A new
  interaction must preserve direct URLs, keyboard navigation, and readable no-JavaScript output.
- **One content model:** post IDs and actual date precision are contracts. Keep aliases when a URL
  retires; do not infer chronology from photos or duplicate facts in components.
- **Browser-owned preferences:** saves and theme are conveniences with consent and failure fallback,
  not remote personal profiles. Keep persistent preferences out of the server API.
- **Separate reactions:** the optional network boundary has a narrow JSON contract and durable
  aggregate totals. User identity and uploads are deliberately outside that service.
- **Visible source, private secrets:** public repository code and client bundles are inspectable.
  The secret salt and service credentials stay in provider configuration. Secrecy of algorithms is
  not an authentication or abuse-control boundary.

For 1.0.0, a separate private backend repository was considered and declined: it would add a
cross-repository build, test, and content-contract workflow without making previously public source
confidential. Keep the tested public service and its secret/configuration/data boundaries explicit.

## Findings and follow-up triggers

| Priority | Evidence and consequence                                                                                                                                                                                                             | Recommended handling                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medium   | The Worker derives allowed reaction keys from `src/data/timeline.ts`, aliases, and reaction kinds at its build time. Pages and Worker deploy independently. New moments/reaction kinds can appear before the API accepts their keys. | Treat content/key changes as a two-unit release. Deploy compatible Worker allowlists before publishing the corresponding site; verify one new key against the service.                                                        |
| Medium   | Browser controllers use markup selectors and several non-null assertions, for example `timeline-controller.ts` and `privacy-controls.ts`. The component/controller interface is structural rather than a typed component API.        | Keep component and controller changes in one review and run affected real-browser flows. Extract a narrow mount/contract only when the same interface becomes reusable; avoid adding a framework solely to replace selectors. |
| Low      | Browser and service implementation share `src/lib/`; runtime isolation is now checked by the first-party dependency gate. Dynamic platform tricks and third-party package internals remain outside its proof.                        | Preserve the gate and review runtime-resolution changes. Split a service package only when backend complexity or deployment ownership justifies it; retain a versioned wire contract and shared tests.                        |
| Low      | Automated coverage and axe checks cannot establish manual screen-reader usability or complete Section 508 conformance.                                                                                                               | Keep the public statement qualified and record the required keyboard/NVDA/VoiceOver evaluation, with the actual platform and findings, before making a conformance claim.                                                     |
| Low      | An incrementing total with revocable or expiring deduplication identifiers permits repeat reactions after identifiers disappear.                                                                                                     | Preserve the current truthful policy and product semantics. A stronger integrity requirement would need a new identity/threat model, not a longer browser key lifetime.                                                       |

## If backend source must become private

Make that a separate migration with an independently tested private repository/package containing
the Worker adapter, HTTP service, migrations, provider configuration, and service tests. Keep the
public request/response contract and public API origin documented. Establish an explicit way to
publish approved post/reaction keys to the service and version it alongside schema migrations.
Verify existing counts, duplicate handling, failure responses, forgetting, and scheduled cleanup
before switching the public site. Remove the public build’s dependency on private source.

Previously published source remains in public Git history and other copies. Moving new development
does not make prior code confidential; browser code and the network contract remain public. Do not
rewrite public history or rotate secrets solely because non-secret source was visible. Credentials
that were actually exposed require a separate incident response.

## Review limits

The project-subpath homepage has less than 1 KiB headroom below its unchanged 80 KiB HTML budget.
This is a content-growth trigger, not spare capacity for another
full card. Before expanding the timeline, review shared markup and static archive/period delivery
while preserving readable no-JavaScript pages, direct moment URLs, and the live browsing model.
Do not hide the pressure by increasing the budget or removing accessible labels.

The source review does not verify provider account access, actual secrets, provider-side retention,
scheduled trigger execution, D1 contents, live response headers, GitHub protection settings, or the
production Worker version. Deployment-specific evidence belongs in release records. Required
validation and manual assistive-technology checks must be reported separately with their results.
