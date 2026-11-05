# Profile polish — November 4, 2026

Carson authorized implementing the full feedback list, using best judgment while he was unavailable,
and merging/deploying the finished branch. The one-off authorization covers the D1 migration,
updated reactions Worker, and frontend release. Standing owner-controlled release rules remain.

## User-visible changes

- The header stays reachable on desktop and mobile, with native Back/Forward controls. Mobile
  navigation is an 86% left-side modal drawer with a blue inert backdrop, safe-area padding,
  Escape/close, and edge-open/swipe-close gestures. The first 16px remains available to native
  browser gestures; interactive controls do not initiate an edge-open gesture.
- The sticky date rail uses one change listener. Empty dates retain their nearest-moment action
  until selected. Mobile pinned-date shortcuts have separate hit areas above the range. Floating
  shortcuts reach the oldest or newest visible timeline region.
- All photographic timeline cards use a consistent right-hand frame on desktop, including
  milestones. Actions align at the bottom. A small top-left album badge and top-right post icon
  use consistent positions; the post icon retains a 44px hit area. The Life feature omits the count.
- Every content photo enlarges in a keyboard-accessible native dialog, including the portrait,
  pinned photos, timeline images, post albums, and Life gallery. Separate post links keep related
  stories easy to reach. Dog gallery images preserve the whole photograph instead of cropping faces.
- Reactions permanently increase counts and cannot be toggled off. Already-selected choices are
  disabled and restored after reload when storage is allowed. Save remains a real bookmark with a
  Saved filter; its first use offers a choice about remembering it between visits.
- Post bodies render approved internal links. The watch collection and built watch link both ways,
  and Apple/watchmaking connect across stories, Work, and Life. Video links explicitly name YouTube.
  External destinations and footer links open new tabs with opener/referrer isolation.
- Returning to the feed uses native history/BFCache where a preceding same-origin entry can be
  identified. No persistent browsing-history store was introduced. Direct links restore the requested
  date before revealing the feed. Older browsers without native entry inspection retain a date-link
  fallback; the header’s native Back button can still restore their exact prior browser entry.
  Fresh document restores wait for the self-hosted font layout before revealing the restored feed.
  Cached returns refresh bookmarks and reaction totals without recreating cards or resetting scroll.
  Recorded positions take precedence over date jumps, and scroll anchoring cannot adjust the feed
  after restoration. Newly pushed date choices do not inherit a different entry’s old position.
- Optional browser persistence requires consent. The notice and Storage settings explain choices,
  withdrawal, and erasure. The [privacy review](PRIVACY-REVIEW.md) records sources and limits.

## Approved content

Expanded TTSNative, PicPledge, Recalen, Vanderbilt, InfoWorks, and Booz Allen explanations use
existing supplied project/role facts. New personal details come directly from Carson’s feedback:

- Golf: best 18-hole score 130 as of November 4, 2026; pickleball: two years of brotherly persuasion
  and Reels jokes before finally trying it, with a link back to golf.
- Margot: goldendoodle, shark-like puppy and sweet adult. Quinn: Aussiedoodle, the Craigslist story,
  smartest dog Carson has had, and a softy. Breeds are consistent on Life and the posts.
- Apple: Genius title, youngest in the market, two promotions while working part time and studying
  full time, iPhone/Mac repair, and its connection to later watchmaking.
- Vanderbilt: four years at Apple to help pay for college, UNSW study abroad, lifelong friends,
  and Student Alumni Board. No new dates or private client details were inferred.
- High school clubs; writing/directing the FBLA video; Roblox and subsequent FPS games; Minetrocity’s
  minigames and its stated influence; the childhood-photo joke and missed best friend.
- Watch build tutorial credit: https://www.youtube.com/watch?v=JM7Do8RU90c .

The 39 incoming originals and their verified external backups remain untouched. No new image imports,
metadata changes, app-brand redesign, DNS changes, paid plan, dependency update, or salt rotation
are part of this release.

## Implementation and release

The shared glyph sprite is a static same-origin SVG containing trusted licensed icon paths.
Optional dialogs and mutation/notice handlers load on intent; initial counts still load normally.
Feed-specific code is separate from post-page browsing code. Existing HTML, script, CSS, and image
budgets stay unchanged. Astro’s hashed CSP remains enabled; ClientRouter is not used because it is
not supported with this CSP configuration.

Apply migration 0002 first, deploy the Worker second, then merge/publish the frontend. Migration 0002
removes only the decrement trigger, preserving existing totals and identifiers. Do not run an old
DELETE-toggle canary cleanup script against this contract. See the Worker README for guarded,
exact canary cleanup. Record final checks, deployment identifiers, and live proof in design-qa.md.

Fresh NVDA and VoiceOver review remains outstanding for the new controls. Automated browser/axe
checks and manual keyboard review are evidence, not a conformance certification.
