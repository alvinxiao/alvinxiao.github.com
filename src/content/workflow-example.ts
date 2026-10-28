export const workflowExample = {
  question: 'When can I collect my order?',
  caveat: 'This is an illustrative scenario, not a client case study or a claim about results.',
  legend: 'What does the customer need?',
  guideTitle: 'A better workflow may not need AI',
  guideHref: '/resources/workflow/',
};

export const workflowExamples: readonly {
  id: 'hours' | 'status' | 'request';
  need: string;
  heading: string;
  paragraphs: readonly [string, string];
}[] = [
  {
    id: 'hours',
    need: 'Standard collection hours',
    heading: 'When a clear answer or template is enough',
    paragraphs: [
      'If the question is about standard collection hours, a visible FAQ and a reusable reply may solve it. Put the answer where customers already look, such as an order confirmation or collection instructions.',
      'This approach has little machinery to maintain. It still needs an owner who updates the wording when hours change. A template with outdated information can cause trouble just as an AI draft can.',
    ],
  },
  {
    id: 'status',
    need: 'Whether an order is ready',
    heading: 'When a rule-based notification fits',
    paragraphs: [
      'If the answer is whether an order is ready, the order system may already support a notification when its status changes. A predictable event and a known message often fit a rule-based approach.',
      'Before turning it on, check which status triggers the message, whether the contact details are correct, and how to handle a failed or duplicate notification. Someone needs a way to correct mistakes and pause the process.',
    ],
  },
  {
    id: 'request',
    need: 'An unusual request',
    heading: 'When an AI-assisted draft may help',
    paragraphs: [
      'A customer might ask a longer question that combines collection arrangements, accessibility needs, and an unusual request. A draft could help organize a reply, provided a person has the right information and reviews the result.',
      "Keep the tool's role narrow. It can help write the response. It should not invent an exception, promise a refund, or decide that an order is ready.",
    ],
  },
];
