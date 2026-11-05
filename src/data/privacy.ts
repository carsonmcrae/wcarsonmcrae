/**
 * Purpose: Explain the actual data practices of this personal website.
 * Scope: Optional storage, anonymous permanent reactions, hosting, rights, and external destinations.
 * Does NOT belong: A claim of worldwide legal certification or unknown provider retention promises.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
export const privacy = {
  updated: '2026-11-05',
  title: 'Privacy & browser storage',
  intro:
    'Daysforth is William Carson McRae’s personal website, based in Nashville, Tennessee. There are no ads, analytics, tracking pixels, accounts, or embedded social-media players.',
  sections: [
    {
      id: 'browser-storage',
      title: 'Your browser, your choice',
      body: 'Optional browser storage is off until you allow it. If allowed, this browser remembers your theme, saved posts, and reaction choices. Otherwise those features use memory for the current page session. Your consent choice is stored for up to 180 days so we can respect it; this necessary preference record is the only application storage used before permission. Change your choice or clear your saved data using Storage settings.',
    },
    {
      id: 'reactions',
      title: 'Permanent reactions',
      body: 'A reaction increases a shared aggregate count permanently. Clicking it again does not remove it. A random browser identifier prevents duplicate votes; it is remembered between visits only with your storage permission. The service stores a salted hash of that identifier, the post/reaction key, and a timestamp. Records become eligible for deletion after 90 days and are removed by hourly cleanup. Aggregate counts remain after identifiers are removed. Clearing browser data can allow a new reaction.',
    },
    {
      id: 'security',
      title: 'Security and abuse prevention',
      body: 'Cloudflare receives the network address needed to handle a reaction request. The application does not store raw IP addresses or raw browser identifiers. A salted network/hour hash limits abuse and expires at the next hourly cleanup. Requests to erase a server identifier are limited to 20 per network per hour to protect service capacity; browser data can still be cleared. Worker request logging is disabled. HTTPS, a restrictive Content Security Policy, bounded requests, and database uniqueness protect the service. Hashes are treated as pseudonymous data, not as proof that data is anonymous.',
    },
    {
      id: 'hosting',
      title: 'Hosting and ordinary browser behavior',
      body: 'GitHub Pages serves the site and records visitor IP addresses for security. Cloudflare supplies DNS, redirects, and the reactions API and may process network/security data under its own policy. Providers can process data outside your country. Normal browser caching and navigation history support page delivery and returning to your place; there is no offline service worker or server-side browsing-history profile. Fonts and images are hosted with the site.',
    },
    {
      id: 'external-links',
      title: 'Links, photos, and other websites',
      body: 'Photos enlarge locally in this site. YouTube and other external destinations load only when you choose their links. External links are labelled, open a new tab, and suppress the opener and referrer. The destination’s own privacy policy applies there. Public content and photos are supplied and approved by Carson.',
    },
    {
      id: 'your-choices',
      title: 'Your choices and privacy requests',
      body: 'You can withdraw storage permission at any time, clear this browser’s saved data, and request removal of its reaction identifier without reducing aggregate counts. Use the Contact page to send Carson a private LinkedIn message for privacy questions or rights requests. Don’t put private information in a public GitHub issue. Depending on your location, rights can include access, correction, deletion, objection, or a complaint to your privacy regulator. There is no sale or advertising sharing of personal data.',
    },
    {
      id: 'children-and-changes',
      title: 'Children and changes',
      body: 'This is a general-audience personal portfolio, not a service directed at children. It does not ask for names, ages, contact details, or uploads. If you believe a child’s personal information was collected, contact Carson. This notice will be updated when site behavior changes.',
    },
  ],
  providers: [
    {
      label: 'GitHub privacy statement',
      href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    },
    {
      label: 'GitHub Pages data collection',
      href: 'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection',
    },
    { label: 'Cloudflare privacy policy', href: 'https://www.cloudflare.com/privacypolicy/' },
  ],
};
