# Product versions and releases

`package.json` is the single source for the current Daysforth version. The footer and release pages
read that value through the typed `src/data/releases.ts` adapter. Authored notes and permanent dates
live in `src/data/release-history.json`. Historical version strings in the release history
identify permanent records; they are not a second setting for the current version.

## Preparing a change

1. Choose a stable `MAJOR.MINOR.PATCH`. Use a patch for visitor-visible corrections, a minor for
   compatible capabilities, and a major for an intentional incompatible change to a public contract
   or established experience. Content changes that alter the published site also need a patch.
2. Update `package.json` and both root versions in `package-lock.json` together (`npm version
<version> --no-git-tag-version --ignore-scripts` can do this). Never create an automatic commit.
3. Prepend a release record in `src/data/release-history.json` with a permanent `date` in `YYYY-MM-DD`
   form and useful visitor-facing changes. Confirm the actual calendar date when the release is
   prepared; never derive old release dates from the current clock or rebuild time. Preserve dates
   on later releases unless Carson explicitly corrects a documented historical error. Keep old
   version URLs and old notes. Avoid implementation logs, invented release dates, and unsupported
   accessibility/security claims. Notes for the new version should explain the resulting experience.
   Keep this authored history as static content. `src/data/releases.ts` checks its readonly
   record/section shape for consumers; the release-policy check validates the full history at
   runtime. Do not put executable logic or generated clock values in the JSON.
4. Update [architecture documentation](../architecture/maintenance.md) when its triggers apply.
5. Run the required validation and record actual manual accessibility checks and any pending work.

The first public notes establish version 1.0.0 even though the unreleased package already used that
number. After the comparison base contains `src/data/releases.ts`, a product change under `src/`,
`public/`, `workers/`, `astro.config.mjs`, or either package manifest requires a strictly higher version. Documentation-only
changes can retain the version. Versions must never move backwards.

## Checks and comparison context

`npm run check:release` checks stable version syntax, lockfile agreement, current public notes,
unique descending release history, real full calendar dates, usable note sections, and any supplied tag identity. It runs
as part of `validate:static`. CI supplies the pull request base commit in `RELEASE_BASE_SHA` with
enough Git history available, so product bumps and architecture maintenance are enforced.

For a local comparison, set `RELEASE_BASE_SHA` to the intended reviewed base commit before running
the check. Without a base it prints that change-sensitive checks were not performed. An invalid or
unavailable supplied base fails rather than silently skipping the comparison. When checking a Git
tag or release, supply `RELEASE_TAG=v<version>`; a mismatched tag fails. A matching tag alone does not
prove that required tests or manual evaluation passed.

Release dates are calendar values, not timestamps. The public list and detail pages use semantic
`<time datetime="YYYY-MM-DD">` elements and format the same calendar day in every time zone.
Changing a displayed historical date never moves or replaces an immutable published Git tag.

## Owner-controlled publication

Carson reviews and merges the validated branch, then performs the authorized tag/release and
deployment actions. Use the exact tag `v<package.json version>` and publish the matching visitor
notes as the GitHub release description, linking the permanent `/releases/<version>/` page. Verify
the tag points to the reviewed source. Keep the source release distinct from the live deployment
record; Pages and the optional Worker are independent deployment units.

The active Published version tags ruleset blocks moving or deleting `v*` tags without a bypass.
Create a new tag only after checking its exact commit; correct an already published release with
a new version rather than replacing its source identity. Only Carson currently has repository write
access; recheck release permissions when collaborators change.

For Worker migrations or new reaction keys, follow the compatibility order in the
[architecture review](../architecture/review.md) and verify the live service separately. Agents do
not infer authorization to publish, merge, tag, change settings, or alter DNS from passing checks.
