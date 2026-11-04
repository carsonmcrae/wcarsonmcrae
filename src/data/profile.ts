/**
 * Purpose: Carson's core profile content.
 * Scope: Name, approved headline, location, employer, summary, portrait and email settings, social
 *   links, homepage hero copy, the two-register introduction, and the homepage highlights.
 * Constraints: Only approved, public facts. The email stays null until an address is approved for
 *   publication.
 * Does NOT belong: Career history (src/data/career.ts), projects (src/data/projects.ts), or
 *   personal life (src/data/life.ts).
 */
import type { Profile, SocialLink } from './types';

export const profile: Profile = {
  name: 'Carson McRae',
  fullName: 'William Carson McRae',
  firstName: 'Carson',
  headline: 'Technical Program & Product Leader',
  location: 'Nashville, Tennessee',
  employer: 'Booz Allen Hamilton',
  summary:
    'Carson McRae is a technical program and product leader in Nashville who helps engineering teams deliver complicated software, then goes home and builds more of it.',
  // A square crop of the approved headshot. The full source remains in src/assets/photos/.
  portrait: 'carson-profile',
  portraitAlt: 'Portrait of Carson McRae',
  // Set to a public address (for example "hello@example.com") to show email
  // on the contact page. Left empty until an address is approved for publication.
  email: null,
};

export const socialLinks: SocialLink[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/carsonmcrae/',
    description: 'Professional conversations and introductions.',
  },
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/carsonmcrae',
    description: 'Code, open-source work, and TTSNative.',
  },
  {
    id: 'portfolio',
    label: 'Product portfolio',
    href: 'https://carsonmcrae.github.io/',
    description: 'Case studies, walkthroughs, and engineering details.',
  },
];

export const hero = {
  title:
    'Hey, I’m Carson. I help teams build complicated things, then go home and build more things.',
  lede: 'I’m a technical program and product leader at Booz Allen Hamilton in Nashville, coordinating software delivery across multiple engineering teams that support the Department of Veterans Affairs. On my own time I build apps, including [TTSNative](https://ttsnative.com), an open-source text-to-speech app.',
  next: 'Here’s [what I do](/work/), [what I’m building](#building), and [what I get up to otherwise](/life/). The quickest way to reach me is [LinkedIn](https://www.linkedin.com/in/carsonmcrae/).',
};

/**
 * "What I actually do", in two registers. Visitors can switch between them,
 * which is also a fair summary of the job.
 */
export const intro = {
  title: 'What I actually do',
  plain: [
    'Big software projects rarely stall because nobody can write the code. They stall because many teams are each building one piece of something larger, and those pieces have to arrive in the right order, fit together, and actually work for the people using them.',
    'That’s the part I work on. I help teams figure out what to build next, spot problems before they turn into emergencies, and get releases out the door with as little drama as possible. Most days I’m translating between what the business needs and what engineers need to know, in both directions.',
  ],
  technical: [
    'I coordinate delivery across several Agile engineering teams supporting the Department of Veterans Affairs: release planning, cross-team dependency management, production issue coordination, and technical risk.',
    'Most of the work sits where product and engineering meet: modernizing legacy applications, supporting API development and integrations, turning business goals into well-scoped work, and tightening the delivery process so dates mean something.',
  ],
  note: 'Booz Allen Hamilton, supporting the Department of Veterans Affairs. Views on this site are my own.',
};
