export type DeliveryMode = 'approval' | 'automatic';

export const workflowExample = {
  title: 'An order change, handled',
  caveat: 'Illustrative workflow. No real emails are sent.',
  legend: 'Delivery',
  emailTitle: 'Example email to Sam',
  email: "Hi Sam, I've updated your order to a matte finish. I'll send your next update on Friday.",
};

export type WorkflowShape = 'request' | 'thinking' | 'document' | 'email';

export const workflowStages = [
  {
    id: 'request',
    shape: 'request',
    title: 'Request arrives',
    text: '“Can you change my order to matte?”',
  },
  {
    id: 'history',
    shape: 'thinking',
    title: 'Look up context',
    text: 'Past emails. Friday updates.',
  },
  { id: 'voice', shape: 'thinking', title: 'Add tone & voice', text: 'Friendly, brief, familiar.' },
  {
    id: 'draft',
    shape: 'document',
    title: 'Draft the email',
    text: 'Order change. Friday update.',
  },
  { id: 'delivery', shape: 'email', title: 'Send the email', text: '' },
] satisfies readonly { id: string; shape: WorkflowShape; title: string; text: string }[];

export const deliveryModes: readonly {
  id: DeliveryMode;
  title: string;
  text: string;
}[] = [
  { id: 'approval', title: 'Human approval', text: 'Review, then send.' },
  { id: 'automatic', title: 'Automatic send', text: 'Send using agreed rules.' },
];
