export type DeliveryMode = 'approval' | 'automatic';

export const workflowExample = {
  title: 'An order change, handled',
  caveat: 'Illustrative workflow. No real emails are sent.',
  legend: 'Delivery',
  emailTitle: 'Example email to Sam',
  email: "Hi Sam, I've updated your order to a matte finish. I'll send your next update on Friday.",
};

export const workflowDuration = 18000;
export const workflowTiming = [
  { arrival: 0, holdUntil: 0.16 },
  { arrival: 0.2, holdUntil: 0.36 },
  { arrival: 0.4, holdUntil: 0.56 },
  { arrival: 0.6, holdUntil: 0.76 },
  { arrival: 0.8, holdUntil: 1 },
] as const satisfies readonly { arrival: number; holdUntil: number }[];

export type WorkflowShape = 'request' | 'thinking' | 'document' | 'email';

export const workflowStages = [
  {
    id: 'request',
    shape: 'request',
    title: 'Request arrives',
    text: '“Can you change my order to matte?”',
    descriptionTitle: 'A customer asks for a change',
    description: 'Sam emails to ask for a matte finish instead of the original finish.',
  },
  {
    id: 'history',
    shape: 'thinking',
    title: 'Look up context',
    text: 'Past emails. Friday updates.',
    descriptionTitle: 'Find the relevant history',
    description:
      'Earlier emails provide the order details and Sam’s preference for Friday updates.',
  },
  {
    id: 'voice',
    shape: 'thinking',
    title: 'Add tone & voice',
    text: 'Friendly, brief, familiar.',
    descriptionTitle: 'Keep the reply sounding like you',
    description: 'Your previous emails guide a friendly, brief reply that feels familiar to Sam.',
  },
  {
    id: 'draft',
    shape: 'document',
    title: 'Draft the email',
    text: 'Order change. Friday update.',
    descriptionTitle: workflowExample.emailTitle,
    description: workflowExample.email,
  },
  {
    id: 'delivery',
    shape: 'email',
    title: 'Send the email',
    text: '',
    descriptionTitle: 'Ready to send',
    description: 'The reply is ready for the delivery option you choose.',
  },
] satisfies readonly {
  id: string;
  shape: WorkflowShape;
  title: string;
  text: string;
  descriptionTitle: string;
  description: string;
}[];

export const deliveryModes: readonly {
  id: DeliveryMode;
  title: string;
  text: string;
  description: string;
}[] = [
  {
    id: 'approval',
    title: 'Human approval',
    text: 'Review, then send.',
    description:
      'You check the order change and Friday update, then approve the email before it is sent.',
  },
  {
    id: 'automatic',
    title: 'Automatic send',
    text: 'Send using agreed rules.',
    description: 'The email is sent automatically using the delivery rules you agreed.',
  },
];
