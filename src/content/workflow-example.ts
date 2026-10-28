export const workflowExample = {
  title: 'Behind the reply',
  caveat: 'Fictional shop example. No live AI.',
  legend: 'Choose a question',
  guideTitle: 'Explore the approaches',
  guideHref: '/resources/workflow/',
};

export const workflowExamples: readonly {
  id: 'hours' | 'status' | 'request';
  need: string;
  question: string;
  sourceLabel: string;
  fact: string;
  approach: string;
  reply: string;
  note: string;
}[] = [
  {
    id: 'hours',
    need: 'Saturday pickup?',
    question: 'Can I collect my order on Saturday?',
    sourceLabel: 'Shop hours',
    fact: 'Saturday · 10am–2pm',
    approach: 'Saved reply',
    reply: 'Yes, you can collect on Saturday between 10am and 2pm.',
    note: 'Keep the hours up to date.',
  },
  {
    id: 'status',
    need: 'Order ready?',
    question: 'Is my order ready?',
    sourceLabel: 'Order #1042',
    fact: 'Ready for collection',
    approach: 'Status notification',
    reply: 'Your order is ready to collect.',
    note: 'Send when the recorded status changes.',
  },
  {
    id: 'request',
    need: 'Special request',
    question: 'Could someone bring my order outside? The steps are difficult for me.',
    sourceLabel: 'Collection policy',
    fact: 'Check which arrangements are possible.',
    approach: 'AI-assisted draft',
    reply: 'Thanks for letting us know. Let me check how we can help with collection.',
    note: 'A person checks before sending.',
  },
];
