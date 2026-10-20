import approvals from './approval.json';
const mode = import.meta.env.MODE;
const localReview = mode === 'development' || mode === 'preview';
export const site = {
  ...approvals,
  preview: mode !== 'production',
  prelaunch: mode === 'prelaunch',
  publicName: mode === 'prelaunch' && !approvals.approvals.identity ? '' : approvals.publicName,
  descriptor: mode === 'prelaunch' && !approvals.approvals.identity ? '' : approvals.descriptor,
  biography: mode === 'prelaunch' && !approvals.approvals.identity ? '' : approvals.biography,
  contactEmail:
    mode === 'prelaunch'
      ? ''
      : localReview
        ? import.meta.env.PUBLIC_CONTACT_EMAIL || approvals.contactEmail
        : approvals.contactEmail,
  formEndpoint:
    mode === 'prelaunch'
      ? ''
      : localReview
        ? import.meta.env.PUBLIC_FORMSPREE_ENDPOINT || approvals.formEndpoint
        : approvals.formEndpoint,
};
export const hero = {
  eyebrow: 'Practical AI help for small businesses',
  title: "Let's figure out how AI can help your business.",
  description:
    "You don't need to be a tech expert to get started. I help small business owners understand AI, work through everyday challenges, and find practical solutions that make their work easier.",
};
export const paths = [
  {
    number: '01',
    title: "I'm new to AI",
    description:
      "Curious about AI but not sure where to begin? I'll help you understand the tools, explore examples relevant to your work, and get comfortable trying them yourself.",
    cta: 'Explore AI Getting Started',
    href: '/services/#getting-started',
  },
  {
    number: '02',
    title: 'I have a problem to solve',
    description:
      "Spending too much time on repetitive work or wondering whether a process could be easier? Let's look at what's happening and explore practical ways to improve it.",
    cta: 'Explore Problem-Solving',
    href: '/services/#problem-solving',
  },
];
export const examples = [
  {
    title: 'The same questions. Again.',
    problem: 'Repeated customer questions',
    solution: 'AI-assisted drafting, an FAQ, or reusable email templates may be appropriate.',
    label: 'Make room for the human part',
  },
  {
    title: 'Less copying. More doing.',
    problem: 'Copying data between spreadsheets',
    solution: 'Formulas, scripts, or basic automation may work without AI.',
    label: 'Sometimes simpler is better',
  },
  {
    title: 'Find the useful bits.',
    problem: 'Organizing documents',
    solution: 'AI-assisted summaries, templates, or a better process may help.',
    label: 'Start with what you need',
  },
];
export const processSteps = [
  {
    title: "Tell me what you're working on.",
    text: "Share what you want to learn or what isn't working well.",
  },
  {
    title: "We'll explore your options.",
    text: "I'll help you understand what tools or approaches make sense.",
  },
  {
    title: 'Leave with practical next steps.',
    text: "Depending on the service, you'll receive guidance, recommendations, or a written assessment.",
  },
];
