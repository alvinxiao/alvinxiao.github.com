import type { Interest } from '../lib/inquiry/model';
export const services = [
  {
    id: 'getting-started',
    name: 'AI Getting Started',
    interest: 'learning',
    label: 'Build your confidence',
    summary:
      'Learn the basics of AI through practical examples and a personalized, hands-on session.',
    details:
      'A practical introduction shaped around what you want to learn. Explore where AI can be useful, where it falls short, and how to approach it thoughtfully.',
    includes: [
      'Personalized education',
      'Practical examples relevant to your work',
      'A one-page guide',
    ],
    excludes: 'Does not include custom implementation or access to your production systems.',
  },
  {
    id: 'problem-solving',
    name: 'AI Problem-Solving',
    interest: 'problem',
    label: 'Work through a challenge',
    summary:
      'Bring a specific challenge and work through possible tools, approaches, and next steps.',
    details:
      'Start with the problem rather than a particular tool. Explore possible approaches together, including options that do not need AI.',
    includes: ['A focused advisory conversation', 'Possible tools and approaches', 'A brief recap'],
    excludes: 'Does not include building a solution, guaranteed outcomes, or ongoing support.',
  },
  {
    id: 'workflow-audit',
    name: 'AI Workflow Audit',
    interest: 'audit',
    label: 'See the bigger picture',
    summary:
      'Take a closer look at one business process to identify opportunities for improvement.',
    details:
      'Look at one defined workflow, where effort goes, and where a change might help. Consider a better process before adding more tools.',
    includes: ['One defined workflow', 'Limited discovery', 'Concise written findings'],
    excludes: 'Does not include compliance audits, production access, or implementation.',
  },
  {
    id: 'custom-automation',
    name: 'Custom Automation',
    interest: 'implementation',
    label: 'Put a good idea to work',
    summary:
      'Get help implementing a solution when the right next step involves connecting tools or automating tasks.',
    details:
      'When implementation is the right next step, define a separate scope around the actual problem and the systems involved.',
    includes: [
      'A separately defined implementation scope',
      'Tools chosen for the actual need',
      'Agreed deliverables before work begins',
    ],
    excludes: 'No integrations, timelines, or project outcomes are promised before scoping.',
  },
] satisfies {
  id: string;
  name: string;
  interest: Interest;
  label: string;
  summary: string;
  details: string;
  includes: string[];
  excludes: string;
}[];
export function serviceHref(id: string) {
  return `/contact/?service=${encodeURIComponent(id)}`;
}
