/**
 * Purpose: Carson's professional background and the About page story.
 * Scope: Roles, education, capabilities, tools, the About page copy, timeline, working principles,
 *   and quick facts.
 * Constraints: Public-safe and accurate: transferable capabilities only, no client details,
 *   internal systems, or unconfirmed titles or dates.
 * Does NOT belong: Projects (src/data/projects.ts) or personal life (src/data/life.ts).
 */
import type { Principle, Role, TimelineEntry } from './types';

/**
 * Professional background. Keep this accurate and public-safe: describe
 * transferable capabilities, never internal systems, customer details,
 * nonpublic project information, or sensitive metrics.
 */

export const workIntro = {
  title: 'Day job, side projects, and everything between.',
  lede: 'What I do all day, where I’ve done it, and what I build after hours.',
};

export const roles: Role[] = [
  {
    organization: 'Booz Allen Hamilton',
    dates: 'September 2022 – Present',
    title: 'Technical program and product leadership',
    summary:
      'I support the Department of Veterans Affairs, coordinating software delivery across multiple engineering teams.',
    groups: [
      {
        title: 'Delivery',
        items: [
          'Plan and coordinate production releases',
          'Manage technical dependencies between teams',
          'Track and reduce technical risk',
          'Make delivery more predictable',
        ],
      },
      {
        title: 'Technology',
        items: [
          'Help modernize legacy applications',
          'Support API development and integrations',
          'Coordinate the response to production issues',
          'Improve engineering processes',
        ],
      },
      {
        title: 'People',
        items: [
          'Work with customers and engineering organizations',
          'Turn business goals into actionable technical work',
          'Lead change management',
          'Keep stakeholders aligned',
        ],
      },
    ],
  },
  {
    organization: 'InfoWorks',
    dates: 'June 2021 – September 2022',
    title: 'Consulting and business analysis',
    summary:
      'Before Booz Allen, I worked in consulting and business analysis: learning how organizations actually operate, and turning what people need into requirements teams can build.',
    groups: [],
  },
  {
    organization: 'Apple',
    title: 'Apple',
    dates: 'July 2018 – May 2022',
    summary:
      'I worked at Apple from July 2018 until May 2022, including while studying abroad in Sydney.',
    groups: [],
  },
];

export const education = {
  school: 'Vanderbilt University',
  year: '2022',
  detail: 'Human & Organizational Development and Political Science',
};

export const capabilities: { title: string; items: string[] }[] = [
  {
    title: 'Delivery leadership',
    items: [
      'Agile delivery across multiple teams',
      'Release planning and coordination',
      'Dependency and risk management',
      'Production issue coordination',
    ],
  },
  {
    title: 'Product',
    items: [
      'Product management',
      'Requirements and backlog shaping',
      'Roadmaps and prioritization',
      'User experience and product design',
    ],
  },
  {
    title: 'Technical',
    items: [
      'APIs and integrations',
      'Legacy application modernization',
      'Software architecture',
      'Automation and AI experiments',
    ],
  },
  {
    title: 'People',
    items: [
      'Stakeholder alignment',
      'Change management',
      'Cross-functional communication',
      'Translating between business and engineering',
    ],
  },
];

/** Tools from Carson's own projects (see the stacks on each project). */
export const tools = [
  'TypeScript',
  'React',
  'Next.js',
  'React Native & Expo',
  'Python',
  'FastAPI',
  'PostgreSQL & Prisma',
  'Cloudflare Workers',
  'Capacitor',
  'ONNX Runtime',
];

export const about = {
  title: 'My full name is William Carson McRae. Everyone calls me Carson.',
  lede: 'That’s where the W in this site’s address comes from.',
  body: [
    'I’m a technical program and product leader at Booz Allen Hamilton, based in the Nashville area. I spend my working hours helping engineering teams deliver software, and a good chunk of my free time building software of my own.',
    'I’ve been doing some version of that second thing since I was a kid. The tools have changed. The urge to understand how something works, and then build a better one, has not.',
  ],
  path: {
    title: 'A slightly unusual path into tech',
    body: [
      'At Vanderbilt, I studied Human & Organizational Development (how people, teams, and organizations actually work) and Political Science (how groups with competing interests reach decisions).',
      'That turns out to be a pretty good foundation for coordinating several engineering teams toward the same release. The technical depth came from the other direction: years of building, breaking, and fixing things on my own.',
    ],
  },
};

export const timeline: TimelineEntry[] = [
  {
    when: 'Age 13',
    title: 'A Minecraft server',
    detail:
      'I worked with developers on a Minecraft server that caught the attention of the creators of Mineplex. It was one of the first things I helped build that other people actually used.',
  },
  {
    when: '2015',
    title: 'My first PC build',
    detail: 'It wasn’t the last.',
  },
  {
    when: '2022',
    title: 'Vanderbilt University',
    detail: 'Graduated after studying Human & Organizational Development and Political Science.',
  },
  {
    when: 'Oct 2026',
    title: 'Married Nicole',
    detail:
      'Our wedding was also the launch of [PicPledge](/work/#picpledge), the event photo-sharing app I built.',
  },
  {
    when: 'Today',
    title: 'Two jobs, one of them paid',
    detail:
      'Leading technical programs at Booz Allen Hamilton by day. Building [Recalen](/work/#recalen) and maintaining [TTSNative](/work/#ttsnative) on my own time.',
  },
];

export const principles: Principle[] = [
  {
    title: 'Done means someone can use it.',
    detail:
      'Merged code is not the finish line. Something is done when the whole journey works for the person on the other end, in the place they actually use it.',
  },
  {
    title: 'Make the tradeoff visible.',
    detail:
      'Every plan gives something up. I’d rather write down what we chose, what we gave up, and why, so the reasoning outlives the meeting.',
  },
  {
    title: 'Learn how it actually works.',
    detail:
      'I want to understand a system well enough to ask good questions, spot risky assumptions, and notice when something sounds too easy.',
  },
  {
    title: 'Stay through delivery.',
    detail:
      'Plans are the easy part. I like staying with the work through release and real use, which is where the interesting problems tend to show up.',
  },
];

export const quickFacts: { label: string; value: string }[] = [
  { label: 'Name', value: 'William Carson McRae (Carson)' },
  { label: 'Based in', value: 'Nashville, Tennessee' },
  { label: 'Works at', value: 'Booz Allen Hamilton' },
  { label: 'Studied', value: 'Vanderbilt University, Class of 2022' },
  { label: 'Builds', value: 'Web apps, mobile apps, and PCs' },
  { label: 'Household', value: 'Nicole, Margot, and Quinn' },
];
