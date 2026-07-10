import type { SiteInfo, Skills, StackGroup, Service, Project } from './types';

export const SITE: SiteInfo = {
  name: 'Gabriel Salazar',
  role: 'Software Engineer / Full Stack Developer',
  tagline: 'Shipping clean, scalable systems for 10+ years.',
  location: 'San José, Costa Rica',
  email: 'gabrielsalazar3092@gmail.com',
  linkedin: 'LinkedIn',
  available: 'Available for freelance · Q2 2026',
  about: `Software Engineer with 10+ years across backend and frontend work.
I build clean, efficient and scalable solutions, leading .NET services and mentoring engineers. I care about sound architecture, fast iteration, and code that's boring in the best way.`,
  stats: [
    { n: '10+', l: 'Years building software' },
    { n: '4+', l: 'Years cloud-native' },
    { n: '.NET', l: 'C# / ASP.NET Core' },
    { n: 'Azure', l: 'Cloud-native' },
  ],
};

export const SKILLS: Skills = {
  Languages: ['C#', 'Python', 'TypeScript', 'JavaScript', 'SQL'],
  Frameworks: ['ASP.NET Core', '.NET 6', 'Next.js', 'React'],
  Cloud: ['Azure', 'Service Fabric', 'Kubernetes', 'Docker', 'AKS'],
  Databases: ['SQL Server', 'Cosmos DB', 'PostgreSQL', 'Redis'],
  Tools: ['Azure DevOps', 'Git', 'xUnit', 'PowerShell'],
  Spoken: ['English (Fluent)', 'Spanish (Native)'],
};

export const STACK_GROUPS: StackGroup[] = [
  {
    title: 'Frontend',
    items: ['Next.js', 'React', 'TypeScript', 'Tailwind v4', 'shadcn/ui'],
  },
  {
    title: 'Backend',
    items: ['C# / .NET', 'ASP.NET Core', 'Node.js', 'REST APIs', 'Microservices'],
  },
  {
    title: 'Cloud & DevOps',
    items: ['Azure', 'Service Fabric', 'AKS', 'Docker', 'CI/CD'],
  },
  {
    title: 'Data',
    items: ['SQL Server', 'Cosmos DB', 'PostgreSQL', 'Redis', 'NoSQL'],
  },
];

export const SERVICES: Service[] = [
  {
    badge: '01',
    title: 'Landing pages & marketing sites',
    desc: 'Next.js + Tailwind + shadcn. Fast, accessible, CMS-ready. Perfect for product launches and personal brands.',
    points: [
      'Next.js 15 + App Router',
      'Tailwind v4 design system',
      'Analytics + SEO',
      'Responsive + accessible',
    ],
  },
  {
    badge: '02',
    title: 'Full-stack web applications',
    desc: 'React or Next.js front-end, .NET or Node backend, SQL or Cosmos DB. Auth, payments, admin — the lot.',
    points: [
      'TypeScript end-to-end',
      'Auth + role-based access',
      'Deploy to Azure or Vercel',
      'Handoff & docs included',
    ],
  },
  {
    badge: '03',
    title: 'Security reviews & secure development',
    desc: 'Security assessments, vulnerability analysis, secure code review, and infrastructure hardening. Grounded in CompTIA Security+ and CySA+ — pragmatic recommendations you can ship this quarter.',
    points: [
      'Security & vulnerability assessments',
      'Secure code review',
      'Threat detection & hardening',
      'Pentest skills in development — not yet a standalone service',
    ],
  },
];

export const PROJECTS: Project[] = [
  {
    title: 'Cloud billing engine',
    role: 'Lead engineer',
    desc: 'High-throughput microservices pipeline running on Azure Service Fabric — processes millions of usage records per hour.',
    tags: ['C#', '.NET 6', 'Service Fabric', 'Cosmos DB'],
  },
  {
    title: 'Internal onboarding portal',
    role: 'Side project',
    desc: 'Next.js + Tailwind + shadcn — onboarding flow for new engineers, mentor matching and progress tracking.',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Postgres'],
  },
  {
    title: 'Exchange automation toolkit',
    role: 'Support Engineering',
    desc: 'PowerShell modules that automated repetitive Exchange admin tasks, freeing hundreds of hours per year.',
    tags: ['PowerShell', 'Exchange', 'M365'],
  },
];
