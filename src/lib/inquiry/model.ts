export const interests = {
  learning: {
    label: 'Learning about AI',
    prompt: 'What would you like to feel more confident about?',
  },
  problem: { label: 'A specific problem', prompt: 'What have you tried so far?' },
  audit: { label: 'A workflow audit', prompt: 'Which part of the workflow takes the most effort?' },
  implementation: { label: 'Custom implementation', prompt: 'Which tools are involved?' },
  other: { label: 'Other / not sure', prompt: '' },
};
export type Interest = keyof typeof interests;
export function isInterest(value: unknown): value is Interest {
  return typeof value === 'string' && Object.hasOwn(interests, value);
}
export const fieldLimits = { name: 100, email: 254, description: 3000, optional_context: 1000 };
export type Inquiry = {
  name: string;
  email: string;
  interest: Interest;
  description: string;
  optional_context: string;
  source_service: string;
};
export type FieldErrors = Partial<
  Record<'name' | 'email' | 'interest' | 'description' | 'optional_context', string>
>;
export type InquiryState =
  | { kind: 'idle' }
  | { kind: 'invalid'; errors: FieldErrors }
  | { kind: 'pending' }
  | { kind: 'confirmed' }
  | { kind: 'failed'; message: string }
  | { kind: 'uncertain'; message: string };
export function validateInquiry(data: {
  name: string;
  email: string;
  interest: string;
  description: string;
  optional_context: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim()) errors.name = 'Enter your name.';
  else if (data.name.trim().length > fieldLimits.name)
    errors.name = 'Keep your name to 100 characters or fewer.';
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ||
    data.email.length > fieldLimits.email
  )
    errors.email = 'Enter a valid email address.';
  if (!isInterest(data.interest)) errors.interest = 'Choose what you would like help with.';
  if (!data.description.trim())
    errors.description = "Tell me a little about what you're working on.";
  else if (data.description.length > fieldLimits.description)
    errors.description = 'Keep your description to 3,000 characters or fewer.';
  if (
    isInterest(data.interest) &&
    interests[data.interest].prompt &&
    data.optional_context.length > fieldLimits.optional_context
  )
    errors.optional_context = 'Keep the extra context to 1,000 characters or fewer.';
  return errors;
}
export const confirmationKey = 'inquiry-confirmed-at';
