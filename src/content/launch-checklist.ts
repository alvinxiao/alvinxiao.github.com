import approval from './approval.json';

const identityReady =
  approval.approvals.identity &&
  [approval.publicName, approval.descriptor, approval.biography, approval.contactEmail].every(
    (value) => value.trim().length > 0,
  );

export const launchChecklist = [
  {
    title: 'Personal introduction and contact details',
    description:
      'The public name, descriptor, and owner-supplied biography are recorded. Supply the public contact email and private notification destination before activating inquiries.',
    ready: identityReady,
  },
  {
    title: 'Services, prices, and working policies',
    description:
      'The service outlines and omission of public prices are accepted. Finalize preparation, scheduling, cancellation, and follow-up terms before paid work. No booking or payment is available.',
    ready: approval.approvals.services && approval.approvals.pricing,
  },
  {
    title: 'Visual design and responsive layout',
    description:
      'Review typography, spacing, colors, illustration, navigation, and the mobile and desktop screenshots.',
    ready: approval.approvals.design,
  },
  {
    title: 'Privacy, retention, and deletion',
    description:
      'Approve the final privacy notice using actual provider settings. Confirm storage limits, the deletion contact, and deletion steps for both provider records and email copies.',
    ready:
      approval.approvals.privacy &&
      approval.approvals.retentionVerified &&
      Boolean(approval.privacyText.trim()),
  },
  {
    title: 'Inquiry service and owner notification',
    description:
      'Verify the current free-plan quota, expected inquiry volume, storage, spam filtering, provider validation, and notification delivery. Submit and delete a real test inquiry before activating the form.',
    ready:
      approval.approvals.providerVerified &&
      approval.approvals.ownerNotificationVerified &&
      /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(approval.formEndpoint),
  },
  {
    title: 'Resource and page content',
    description:
      'Review the draft articles and final page copy for accuracy, useful examples, and factual claims. Confirm the intended About and Resources scope.',
    ready: approval.approvals.resources,
  },
  {
    title: 'Accessibility, performance, and search checks',
    description:
      'Review automated results and complete manual keyboard, screen-reader, zoom, contrast, and reduced-motion checks. Verify final performance scores, page metadata, routes, and assets.',
    ready: approval.approvals.qualityVerified,
  },
  {
    title: 'Hosting, historical URLs, and rollback',
    description:
      'Confirm HTTPS, the public domain, historical URL handling, release permissions, and a recoverable previous artifact. Rehearse rollback before the full launch.',
    ready: approval.approvals.hostingVerified,
  },
  {
    title: 'Final launch review',
    description:
      'Review the completed checklist and approve the fully launched site and live inquiry collection. Publishing this prelaunch does not mark these items complete.',
    ready: approval.approvals.release,
  },
] satisfies { title: string; description: string; ready: boolean }[];
