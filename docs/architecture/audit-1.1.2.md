# Engineering hardening audit for 1.1.2

Prepared November 5–6, 2026 from clean `main` at
`e77f2fe44755adb1d4d5962dcf0abdc24e6200db` (1.1.1), on
`codex/engineering-hardening`. Three independent browser, performance and Worker reviews feed
one integration owner. Builds and integrated checks have one owner and run sequentially.
The [QA record](../qa/1.1.2.md) identifies the validated source and actual closeout results.

## Scope and boundaries

The review traced browser entries through controllers, native navigation/history, dialogs,
consent/storage, images and the reaction client; static routes, metadata, build configuration,
CLI gates, Worker HTTP/SQL, migrations, recovery and CI/deployment. Earlier reports were checked
against source, focused regressions and fresh measurements. Incoming originals and committed
photo bytes were untouched. UI, facts, routes, aliases, themes, native links and permanent totals
remain the compatibility contract. No production mutations, telemetry, accounts, paid services,
framework migration or general application server were introduced.

## Findings ledger

Locations below name the owning source and operation; regressions test behavior at that boundary.
Medium means a meaningful reliability, privacy, compatibility or operational consequence. Low
means bounded waste or attribution pressure without evidence of current user harm.

| Class / severity                  | Source and evidence                                                                                                                                                 | Root cause / correction                                                                                                                                                                                             | Regression and uncertainty                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Confirmed / medium                | `src/lib/deferred-controls.ts`, failed `load`: one rejected optional module removed global `.js`; first image click was swallowed.                                  | A feature failure owned global presentation. Keep the shell enhanced, scope menu/photo fallback, follow the original photo link, release buffered commands and retry only on explicit intent.                       | Unit rejected-load/replay/disposal cases and real missing-chunk browser cases. Browsers may cache failed module loads until reload; fallback remains useful.                                           |
| Confirmed / medium                | `src/lib/consent.ts`, `clearPreferences`: throwing `length`, `key` or `removeItem` rejected the privacy event before synchronization.                               | Storage enumeration/removal lacked the guards already used for individual preferences. Continue independent removals, return partial status, notify adapters, and keep denied persistence off for the current page. | Denied enumeration/removal/write tests and pending-erasure feedback checks. A browser that refuses storage operations cannot promise cross-reload deletion or revocation; feedback says so.            |
| Confirmed / medium                | `src/scripts/site.ts`, synchronous mount array: a capability/contract exception prevented later unrelated controls from starting.                                   | Independent mounts shared an unguarded expression. A small mount/cleanup boundary preserves later features and reports a stable programming-failure category.                                                       | Throwing-capability composition test proves privacy still works; cleanup failure does not stop later cleanup. Contract failures remain visible through diagnostics.                                    |
| Confirmed / medium                | `src/lib/reaction-api.ts`, count/vote requests: neither headers nor body had a deadline.                                                                            | A stalled promise held same-key deduplication and controls indefinitely. Five-second abort plus a settling race bounds both phases.                                                                                 | Stalled headers/body, transport ignoring abort, timer release and deliberate same-identity retry. Client abort cannot undo an accepted server mutation.                                                |
| Confirmed gate gap / medium       | `tests/build/budgets.test.ts` counted a 27-byte script-tag stub but omitted its imported site chunk and transitive dependencies.                                    | Measure unique emitted ES-module edges, including shared chunks; validate deferred resources too. Preserve the existing 20 KiB eager budget and byte-count inline content.                                          | Root and subpath builds enforce the complete eager graph and resolve every deferred edge. Loading changes must also be checked against the actual waterfall.                                           |
| Confirmed configuration gap / low | `astro.config.mjs`: Astro 7.4.1's build assembly overwrites top-level `modulePreload`.                                                                              | Set the intended option in `astro:build:setup`, after assembly. Vite retains its error/CSS helper; JavaScript preload dependency maps disappear.                                                                    | Unit hook composition and emitted-output gate. This does not promise the absence of Vite's helper or changes to native module loading.                                                                 |
| Measured opportunity / low        | `MomentImage.astro`, `PostCard.astro`: 1,209 bytes of duplicate image identities and 1,188 bytes of duplicate card identity/date metadata on the baseline homepage. | Use canonical photo parents and permanent card anchors / semantic `time` through one reader. Keep explicit photo names, alt text, date precision and links.                                                         | Generated frame selectors, focal points, gallery and approved-content/permalink equivalence checks. Net savings include the added responsive sizes declaration; see QA.                                |
| Measured opportunity / medium     | `PostMedia.astro`: 236 CSS-pixel desktop Timeline covers selected 800-pixel resources at DPR 1 and 2.                                                               | Native lazy-image `sizes="auto, …"` uses the real slot in supporting browsers, keeping a conservative viewport fallback bounded by existing candidates.                                                             | Real candidate/byte measurements at 390/1440 pixels, DPR 1/2, both views and engines. Existing maximum candidate still bounds larger displays.                                                         |
| Measured opportunity / low        | `moment-navigator.ts`, scroll update: every callback reread viewport/cards and rewrote all current attributes.                                                      | Coalesce to one animation frame, skip irrelevant presentations, update only old/new current nodes and cancel pending work on disposal.                                                                              | A 200-event burst causes one scan and zero current writes when selection is unchanged. This is operation-count evidence, not a latency claim.                                                          |
| Compatibility gap / medium        | `reaction-targets.ts`: published image keys depended exclusively on current presentation.                                                                           | Retain all 65 baseline image identities in `published-image-reactions.json`; release comparison enforces append-only support.                                                                                       | Retired-presentation fixture preserves accepted keys/counts, and CLI/base-registry removal fails. New targets still require Worker-first rollout.                                                      |
| Operational gap / medium          | Worker had no useful schema health probe, safe failure classification or exact serving-artifact identity.                                                           | Add read-only `/health`, bounded schema/read probes, safe unavailable codes, package header and validated provider version UUID. Site HTML and `/build.json` carry version/source attribution.                      | Real SQLite health/schema/error/no-write tests, Worker binding tests and built receipt/meta equivalence. These identify a future deployment only after publication; no live configuration is inferred. |

## Fresh reassessments and deferrals

Further confirmed lifecycle cases were corrected during integration:

- `timeline-controller.ts`, loaded `onClick`: Ctrl/Command-click on a navigator anchor was
  canceled and changed the current reading date. An execution of the real controller reproduced
  `defaultPrevented: true` with a changed date. The shared primary-click resolver now preserves
  native modified and non-primary link intent after initialization as well as before lazy loading.
  Native navigator/nearest URLs also carry the target month rather than the previous query date;
  a real new-page fixture confirmed the old conflicting URL left Born 5,220 pixels offscreen.
  Focused event-boundary cases preserve ordinary nested-control activation, and a native popup
  regression checks the actual destination's visibility as well as its URL. Date-only startup also
  left later same-month cards below the viewport. Fresh explicit-date initialization now reuses
  exact-card navigation for a visible matching hash, with date/filter/history precedence intact;
  popup and 390-pixel native-entry cases check those later cards' titles.
- `timeline-controller.ts`, first deferred default mount: the Windows trace showed cards moved
  between `h3.focus()` and the next assertion, leaving focus on the body. Initial mounting now
  adopts the existing monthly groups in place and derives runtime period metadata from semantic
  dates. The same period list owns observation, reading-date inference and first-group jumps.
  No card or focused descendant moves until a visitor actually changes grouping/filter/view.
  Two unit regressions failed before the fix; a held-module real-browser case protects the handoff.
- `timeline-controller.ts`, category/date label updates: controlled WebKit presses at 200% text
  established that replacing a summary's text node during `mousedown`/`mouseup` canceled its native
  click. Hydrating before the press opened the menu; hydrating during it left the menu closed with
  identical scroll position and rectangles. Updating the existing `Text.data` preserved activation
  for both summaries, with unchanged and changed labels. The correction preserves text-node identity
  and validates that text-only contract; native held-module and label-identity cases protect it.
  CodeQL subsequently classified the `.data` assignment as an HTML sink despite the `Text` guard.
  The implementation now uses the explicit `nodeValue` text channel, retaining identity and a
  regression proving markup-like values create no elements. No finding was dismissed or suppressed;
  verification checks the CodeQL result context and alert state, not only the successful analysis job.
- `playwright.config.ts`, native desktop tab validation: isolated Linux reduced-headless-shell
  runs opened and loaded the real tab but omitted its protocol navigation event. Foreground and
  normal-profile controls remained unreliable; full Chromium from the same pinned release passed
  9/9 unchanged native destinations. Desktop validation now uses that full browser channel, with
  all gestures, result assertions, deadlines and zero retries retained. This corrects the test
  backend for native-window behavior; no application workaround or new dependency was introduced.
- `interaction.css`, temporary restore hold: full Chromium on Windows left card-copy descendants
  with computed `visibility:hidden` after main became visible, so later native navigator commands
  could not focus their titles. Handler ordering, animation-frame focus and forced layout controls
  did not resolve it. An opacity-only control passed 9/9 focus assertions but exposed invisible
  controls. The integrated hold instead applies native `inert` before main's children parse and
  uses opacity only while inert. This retains blocked focus and accessibility-tree exclusion;
  native unsupported browsers keep the original visibility fallback. A CSP-hashed inline script
  owns acquisition; shared ready/fallback release and the early module-error handler clear it.
  A controlled 3-context run passed all nine original native title-focus assertions and checked
  native Chromium AX exclusion/release. Held-load success/failure regressions passed in both
  Chromium presentations and WebKit, retaining existing deadlines and real keyboard input.
- `consent.ts`, `recordConsent`: a saved grant followed by failed memory-key promotion switched
  reads to missing persistent values. Promotion now fails closed, attempts to persist denial and
  retains the page's existing memory choices. Tests cover both writable and denied revocation.
- `action-choices.ts` / `post-action-events.ts`: refreshing choices after a confirmed vote whose
  optional flag write failed could unselect that vote. Hydration now uses the event controller's
  real session reader; BFCache/storage refresh preserves it and Forget invalidates it. No extra
  POST is needed. Pending clipboard success/failure also becomes inert after disposal.
- `photo-reaction-controls.ts`: late forgotten-identity success/failure could announce stale
  feedback. Identity/liveness checks suppress that feedback while preserving confirmed public
  totals. Success, failure and cleared-choice regressions cover the boundary.
- `privacy-controls.ts`, `removeIdentity`: any 2xx reply previously counted as erasure confirmation,
  even with malformed, missing or false JSON acknowledgement. Eight new regressions failed that
  implementation. The client now requires `{"forgotten":true}` within the existing five-second
  header/body deadline; late acknowledgements cannot change expired feedback. An existing browser
  identifier with a disabled service also leaves remote removal unconfirmed without making a request.
  Browser clearing remains immediate, permanent counts stay intact, and the real Worker wire contract
  is unchanged. Failure feedback describes confirmation uncertainty rather than claiming non-removal.

The eager graph correction also exposed unnecessary cross-page loading. Shell, action, media,
secondary-page and timeline entries now have explicit ownership. The default timeline renders at
build time; input code loads on actual intent, or immediately for query/history restoration.
One date controller owns synchronization and resolves live reading geometry before queued commands.
There is no initial regrouping or duplicate date-state owner. While its first import is pending,
the date chip can retain its initial value; this timing tradeoff is explicit and the complete
command/focus/history flows require browser verification. Action flags stay immediate; visibility
and first command share one enhancement initializer. Conditional transfers are reported separately
from the static eager graph. Shared initial shell libraries are grouped through supported Rolldown
configuration, with deferred code kept outside that group.

The [QA record](../qa/1.1.2.md) also records the cost of those boundaries: the complete graph and
CSS grow, and an uncached full-navigation fixture makes more requests for smaller modules.
Repeated same-document module requests are absent; fixed journey timings overlap under shared
workstation load. The result is reduced eager bytes and navigator operations, not proof of a
general latency or complete-journey bandwidth improvement. Further chunk consolidation should
respond to measured cold-navigation cost without pulling deferred work back into every page.

The keyboard/visual review also confirmed a medium accessibility defect in
`src/styles/global.css`, `.skip-link`: its stacking level (10) was below the sticky header (20).
The first Tab focused a link whose label was covered. Raising it above the header preserves the
ordinary layout and makes the focus destination visible. The browser regression now checks the
focused link's actual hit-test visibility in both themes before activating the main landmark.

- **Retention growth:** actual migrations still produce `SCAN reactions` for timestamp cleanup.
  At 100/10,000/100,000 synthetic retained rows, ten rolled-back-delete medians were
  0.0074/0.2301/2.7083 ms; an experimental index gave 0.0086/0.0074/0.0080 ms. No production
  volume establishes a current defect. The [operations guide](../../workers/reactions/OPERATIONS.md)
  records reproducible conditions, row-cost triggers and the additive-index proposal.
- **POST/DELETE ordering:** an isolated SQLite interleaving pauses accepted POST before insertion,
  completes DELETE, then commits the POST. Existing retention later removes the row while keeping
  its total. Client sequencing cannot establish global erasure. A tombstone/coordinator would retain
  more identifier state and alter the protocol; stronger guarantees require a separate decision.
- **Windows WebKit:** a fixed three cold samples per engine/server used the same 1.1.1 bytes.
  Chromium click-to-open was 71–88 ms; WebKit 3.65–4.64 s on Astro HTTP/2 and 1.99–4.66 s on a
  separate HTTP/1.1 static fixture. Static module handlers finished in 0.9–3.25 ms. Astro's WebKit
  viewer transfers took 21–23 ms after late request starts; one HTTP/1.1 sample showed a 3.59 s
  browser resource interval despite a roughly 2 ms server handler. This distinguishes server
  handling from browser delivery/scheduling. It does not identify an upstream root cause, prove
  production latency or justify changing application deadlines/tests until green.
- **Architecture:** cohesive timeline/viewer/service coordinators remain appropriate. Page-specific
  composition and real deferred work address measured payload rather than arbitrary file sizes.
  The runtime dependency gate still protects browser/build/Worker/CLI separation. No new framework
  or package boundary is justified by current ownership.
- **Security/privacy:** SQL remains fixed and parameterized; real uniqueness/triggers preserve
  idempotency and permanent totals. Origins/CORS remain browser controls, not authentication.
  No visitor data, raw exceptions, private configuration or persistent correlation IDs enter new
  diagnostics. Secret/provider settings, actual retention and free-plan usage remain unverified.

## Operational completeness and visibility limits

The [site deployment guide](../DEPLOYMENT.md) and
[Worker operations guide](../../workers/reactions/OPERATIONS.md) now cover artifact attribution,
safe failure evidence, cron verification, schema compatibility, private backups, synthetic recovery,
rollback and the danger of replaying increment triggers or resurrecting erased identifiers.
The SQLite recovery regression verifies permanent totals separately from retained identifiers.

Browser warnings are bounded per document and contain stable operation/category/release values.
They are local diagnostics, not production monitoring. Provider request logging stays disabled.
No source maps, telemetry endpoint, retention store or monitoring vendor is enabled. Exact source
attribution supports local reproduction; minified third-party/native stacks may still need a
separate symbolication artifact. The guides make the remaining remote-alert gap and a concrete
privacy-preserving future health-check proposal explicit.

All publication, settings, DNS, destructive recovery and external monitoring changes remain
owner-controlled. Historical audit records/dates and existing published tags are preserved.
