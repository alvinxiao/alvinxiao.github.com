export type DeliveryMode = 'approval' | 'automatic';

export const workflowExample = {
  title: 'From conversation to email',
  caveat: 'Illustrative workflow. No real emails are sent.',
  legend: 'Delivery',
  emailTitle: 'Example email to Sam',
  email: "Hi Sam, I've noted the matte finish you requested. I'll send your next update on Friday.",
};

export const workflowStages = [
  { id: 'history', title: 'Past customer emails', text: 'Matte finish. Friday updates.' },
  { id: 'voice', title: 'Tone & voice', text: 'Friendly, brief, familiar.' },
  { id: 'draft', title: 'Draft email', text: 'A reply using that context.' },
  { id: 'delivery', title: 'Delivery', text: '' },
];

export const deliveryModes: readonly {
  id: DeliveryMode;
  title: string;
  text: string;
}[] = [
  { id: 'approval', title: 'Human approval', text: 'Review before sending.' },
  { id: 'automatic', title: 'Automatic send', text: 'Send using agreed rules.' },
];
