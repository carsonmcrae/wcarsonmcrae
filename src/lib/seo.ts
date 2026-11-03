/**
 * Purpose: Builds the metadata every page needs for search engines and link previews.
 * Scope: Page titles, canonical URLs, Open Graph and Twitter tags, schema.org Person data, and
 *   JSON-LD serialization that cannot break out of its script element.
 * Does NOT belong: Rendering the tags (src/components/SiteHead.astro) or the page copy
 *   (src/data/site.ts).
 */
import { absoluteUrl } from './paths';

export interface SeoInput {
  title: string | undefined;
  description: string;
  path: string;
  siteName: string;
  defaultTitle: string;
  site: string;
  base: string;
  image: string;
  imageAlt: string;
  locale: string;
}

export interface SeoTags {
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
}

export function formatTitle(title: string | undefined, siteName: string, defaultTitle: string) {
  return title ? `${title} · ${siteName}` : defaultTitle;
}

export function buildSeo(input: SeoInput): SeoTags {
  const title = formatTitle(input.title, input.siteName, input.defaultTitle);
  const canonical = absoluteUrl(input.path, input.site, input.base);
  const image = absoluteUrl(input.image, input.site, input.base);
  return {
    title,
    description: input.description,
    canonical,
    image,
    imageAlt: input.imageAlt,
    openGraph: {
      'og:type': input.path === '/' ? 'profile' : 'website',
      'og:site_name': input.siteName,
      'og:locale': input.locale,
      'og:title': title,
      'og:description': input.description,
      'og:url': canonical,
      'og:image': image,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': input.imageAlt,
    },
    twitter: {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': input.description,
      'twitter:image': image,
      'twitter:image:alt': input.imageAlt,
    },
  };
}

export interface PersonInput {
  name: string;
  fullName: string;
  headline: string;
  employer: string;
  locality: string;
  region: string;
  school: string;
  url: string;
  image: string;
  sameAs: string[];
}

/** schema.org Person data so search engines can connect Carson's profiles. */
export function buildPersonJsonLd(person: PersonInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    alternateName: person.fullName,
    jobTitle: person.headline,
    url: person.url,
    image: person.image,
    worksFor: { '@type': 'Organization', name: person.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: person.school },
    homeLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: person.locality,
        addressRegion: person.region,
        addressCountry: 'US',
      },
    },
    sameAs: person.sameAs,
  };
}

/** Serializes JSON-LD safely for embedding inside a <script> element. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
