/**
 * Purpose: Integrity, style, and privacy checks for the site's content and source.
 * Scope: Links and pages referenced by the data, page metadata, project rules, approved facts,
 *   banned buzzwords, typographic tidiness, and scans for phone numbers, email addresses, street
 *   addresses, and credentials.
 * Does NOT belong: Checks on the built output (tests/build).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as accessibilityData from '../../src/data/accessibility';
import * as career from '../../src/data/career';
import * as life from '../../src/data/life';
import * as profileData from '../../src/data/profile';
import * as projectData from '../../src/data/projects';
import * as siteData from '../../src/data/site';
import * as brandData from '../../src/data/brand';
import * as timelineData from '../../src/data/timeline';
import * as galleryData from '../../src/data/photo-gallery';
import * as privacyData from '../../src/data/privacy';
import { availableProjectImages } from '../../src/lib/images';
import { isExternalUrl } from '../../src/lib/paths';
import { walk } from '../support/walk';

const ROOT = join(import.meta.dirname, '..', '..');
const allData = {
  accessibilityData,
  career,
  life,
  profileData,
  projectData,
  siteData,
  brandData,
  timelineData,
  galleryData,
  privacyData,
};

/** Every string anywhere in the content layer. */
function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') {
    found.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, found));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, found));
  }
  return found;
}

const strings = collectStrings(allData);
const markdownLinks = strings.flatMap((text) =>
  Array.from(text.matchAll(/\[[^[\]]+\]\(([^()\s]+)\)/g), (match) => match[1]!),
);
const hrefs = [
  ...strings.filter((text) => /^(?:https?:|\/)/.test(text) && !text.includes(' ')),
  ...markdownLinks,
];
const pageFiles = new Set(readdirSync(join(ROOT, 'src/pages')));

function pageExists(path: string): boolean {
  const clean = path.split('#')[0]!;
  if (clean.startsWith('/posts/'))
    return timelineData.timelinePosts.some((post) => clean === `/posts/${post.id}/`);
  if (clean === '/') {
    return pageFiles.has('index.astro');
  }
  const name = clean.replace(/^\/|\/$/g, '');
  return pageFiles.has(`${name}.astro`) || existsSync(join(ROOT, 'src/pages', name, 'index.astro'));
}

describe('links in the content layer', () => {
  it('only uses https for external links', () => {
    const external = hrefs.filter(isExternalUrl);
    expect(external.length).toBeGreaterThan(10);
    for (const href of external) {
      expect(href, href).toMatch(/^https:\/\//);
      expect(() => new URL(href)).not.toThrow();
    }
  });

  it('points internal links at pages that exist', () => {
    const internal = hrefs.filter((href) => !isExternalUrl(href) && href.startsWith('/'));
    for (const href of internal) {
      if (/\.(?:png|svg|jpg|webp)$/.test(href)) {
        expect(existsSync(join(ROOT, 'public', href)), href).toBe(true);
      } else {
        expect(pageExists(href), href).toBe(true);
      }
    }
  });

  it('has a page for every navigation item and page entry', () => {
    for (const item of siteData.navigation) {
      expect(pageExists(item.href), item.href).toBe(true);
    }
    for (const page of Object.values(siteData.pages)) {
      expect(pageExists(page.path), page.path).toBe(true);
    }
  });
});

describe('page metadata', () => {
  it('has useful, search-friendly descriptions', () => {
    for (const page of Object.values(siteData.pages)) {
      expect(page.description.length, page.id).toBeGreaterThanOrEqual(70);
      expect(page.description.length, page.id).toBeLessThanOrEqual(170);
    }
  });

  it('uses each page id once', () => {
    for (const [key, page] of Object.entries(siteData.pages)) {
      expect(page.id).toBe(key);
    }
  });
});

describe('projects', () => {
  const { projects } = projectData;

  it('leads with TTSNative, the open-source project', () => {
    expect(projects[0]?.id).toBe('ttsnative');
    expect(projects[0]?.status).toBe('Open source');
  });

  it('has unique ids, an icon, and at least one link each', () => {
    expect(new Set(projects.map((project) => project.id)).size).toBe(projects.length);
    for (const project of projects) {
      expect(availableProjectImages(), project.id).toContain(project.icon);
      expect(project.links.length, project.id).toBeGreaterThan(0);
      expect(project.stack.length, project.id).toBeGreaterThan(0);
    }
  });

  it('links to the product portfolio and GitHub', () => {
    expect(projectData.portfolioUrl).toBe('https://carsonmcrae.github.io/');
    expect(projectData.githubUrl).toBe('https://github.com/carsonmcrae');
    expect(profileData.socialLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining([projectData.portfolioUrl, projectData.githubUrl]),
    );
  });
});

describe('accessibility statement', () => {
  it('never claims full conformance and lists what is still pending', () => {
    const { accessibility } = accessibilityData;
    expect(collectStrings(accessibility).join(' ')).not.toMatch(/fully (?:compliant|conformant)/i);
    expect(accessibility.limitations.length).toBeGreaterThan(0);
    expect(accessibility.standard).toMatch(/Section 508/);
    expect(accessibility.standard).toMatch(/WCAG 2\.2/);
  });
});

describe('approved facts', () => {
  it('uses the approved headline rather than an unconfirmed job title', () => {
    expect(profileData.profile.headline).toBe('Technical Program & Product Leader');
    expect(career.roles[0]?.organization).toBe('Booz Allen Hamilton');
  });

  it('does not publish an email address until one is approved', () => {
    expect(profileData.profile.email).toBeNull();
  });

  it('refers to images by name, never by path', () => {
    const names = [
      profileData.profile.portrait,
      life.nicole.photo,
      ...life.dogs.map((dog) => dog.photo),
      ...life.dogs.map((dog) => dog.swatch),
    ];
    for (const name of names) {
      expect(name).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('writing style', () => {
  const BANNED = [
    /synerg/i,
    /visionary/i,
    /thought leader/i,
    /results[- ]driven/i,
    /passionate about driving/i,
    /transforming the future/i,
    /lorem ipsum/i,
    /rock ?star/i,
    /\bninja\b/i,
    /\bguru\b/i,
    /world[- ]class/i,
  ];
  const sourceFiles = walk(join(ROOT, 'src')).filter((file) => /\.(?:astro|ts)$/.test(file));

  it('avoids buzzwords and filler everywhere in the source', () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of BANNED) {
        expect(pattern.test(text), `${relative(ROOT, file)} matches ${pattern}`).toBe(false);
      }
    }
  });

  it('uses typographic apostrophes and tidy spacing in copy', () => {
    for (const text of strings) {
      expect(text, text).not.toMatch(/[a-z]'[a-z]/i);
      expect(text, text).not.toMatch(/ {2}/);
      expect(text, text).toBe(text.trim());
    }
  });
});

describe('privacy guardrails', () => {
  const files = [
    ...walk(join(ROOT, 'src')),
    ...walk(join(ROOT, 'public')),
    ...walk(join(ROOT, 'docs')),
    join(ROOT, 'README.md'),
  ].filter(
    (file) => existsSync(file) && /\.(?:astro|ts|css|md|txt|xml|svg|json|webmanifest)$/.test(file),
  );

  const PATTERNS: [string, RegExp][] = [
    ['phone number', /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/],
    // GitHub noreply addresses are public by design (they are on every commit), so they are allowed.
    [
      'email address',
      /\b[\w.%+-]+@(?!example\.(?:com|org)\b|users\.noreply\.github\.com\b)[a-z\d.-]+\.[a-z]{2,}\b/i,
    ],
    [
      'street address',
      /\b\d{2,6}\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Pike|Boulevard|Blvd)\b/,
    ],
    ['credential', /\b(?:ghp_[a-z\d]{20,}|github_pat_\w{20,}|AKIA[\dA-Z]{16}|sk-[a-z\d]{20,})/i],
  ];

  it('scans a meaningful set of files', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(PATTERNS)('contains no %s', (_label, pattern) => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(pattern.test(text), relative(ROOT, file)).toBe(false);
    }
  });
});
