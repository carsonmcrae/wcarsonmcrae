# Daysforth 1.0.0 implementation record

This release implements Carson’s November 5, 2026 feedback. Visitor-facing capabilities are in
[the versioned release notes](../src/data/releases.ts); security evidence and scope are in
[the security review](SECURITY-AUDIT.md). Deployment identifiers and final checks belong in the
release pull request and [design QA](../design-qa.md).

## Experience changes

| Request                                           | Implementation                                                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile drawer branding and quiet storage settings | Approved Daysforth mark and wordmark in the drawer; content-width storage actions with accessible hit areas in the drawer and footer.                            |
| Separated timeline shortcuts                      | Newest/oldest shortcuts occupy upper/lower safe screen positions, with the upper shortcut below mobile browsing controls.                                        |
| Readable privacy page                             | Central policy content, a section index, measured reading columns, and a single-column narrow layout.                                                            |
| Visible household diagram                         | Responsive semantic management/staff cards with custom connector artwork; the complete hierarchy also reads without the decoration.                              |
| Dog and personal galleries                        | Existing primary dog cards retain breed details. Each dog has a distinct seven-photo album; About retains its portrait and adds eight photos.                    |
| Horizontal watch photo                            | Life uses the newly supplied horizontal Fossil photograph.                                                                                                       |
| Photo-modal scroll isolation                      | The native photo dialog locks background scrolling and cancels an outstanding smooth scroll; closing restores focus without moving the page.                     |
| Navigation alignment and link polish              | Desktop navigation is centered independently of the logo/actions. Standalone photo/story destinations use restrained bordered chips; sentence links stay inline. |
| Compact footer                                    | Explore and More remain visible in wrapping rows, with release/version and quiet privacy/storage actions.                                                        |
| Consistent expand placement                       | The shared media frame follows the actual image; its small expand affordance remains in the photograph’s upper-right corner.                                     |

All 21 new originals have a separate verified backup. Derived copies were normalized and stripped
of metadata; all 60 incoming originals remain untouched. See [content maintenance](CONTENT.md).

## Maintenance and security changes

- Published a permanent release index and 1.0.0 page, with canonical package-version/history checks,
  future product-version enforcement, tag verification, and architecture-update reminders.
- Added maintained architecture ownership, data-flow, decision, and review documentation. Runtime
  dependency checks and complexity limits make the relevant review findings executable rules.
- Added explicit first-party ownership/SPDX notices and restricted reuse terms, while permitting
  focused fixes and preserving third-party licenses and GitHub’s viewing/forking rights. This is
  public, source-available code; it is not an unrestricted open-source license.
- Kept the Worker in this repository. Credentials, the reaction salt, database contents, and local
  deployment state remain outside Git; hiding non-secret code would not replace those boundaries.
- Indexed identity erasure and bounded it separately from new reactions, without changing existing
  reaction identifiers, salts, bucket namespaces, or permanent totals.
- Patched the two development dependency vulnerabilities found by Trivy. Added digest-pinned
  Semgrep and Trivy checks to the required CI aggregate alongside existing checks.
- Expanded genuine per-file coverage to executable adapters, browser entry points, CLI tools,
  static endpoints, and build/browser configuration. No coverage or duplication threshold was lowered.
- Configured owner-specific pull-request review bypass while retaining required checks, resolved
  conversations, and blocked force pushes/deletion. Patches from other contributors remain welcome.

## Verification limits

Automated browser checks cover desktop Chromium, mobile Chromium, and mobile WebKit in both themes.
The manual Windows browser review covers layout, native dialogs, navigation, and keyboard behavior.
NVDA remains off at Carson’s request; fresh NVDA and VoiceOver evaluation is not claimed. Scanners,
coverage, and automated accessibility checks are evidence, not a certification of zero risk or full
accessibility conformance.
