# Full launch checklist

The owner authorized incremental public prelaunch publication on October 20, 2026. The public site remains clearly labelled prelaunch, unindexed, and unable to submit inquiries. The items below govern the full commercial launch. They do not block publishing prelaunch progress.

The public version of this checklist is `/launch-checklist/`. Do not mark an owner or provider item complete based only on successful automated tests.

## Identity and content

- [ ] Supply and approve the exact public name and professional descriptor.
- [ ] Approve a real biography and every qualification or experience claim.
- [ ] Supply the public contact address and configure the private notification inbox only in Formspree.
- [ ] Approve service scope, inclusions, exclusions, session lengths, and deliverables.
- [ ] Approve prices or explicitly approve their omission, and settle service and clarification policies.
- [ ] Approve Home, Services, About, Contact, and the completed Markdown resource articles.
- [ ] Confirm that no placeholders, provisional prices, invented results, or unapproved claims enter the full launch output.

## Design and accessibility

- [ ] Review desktop/mobile screenshots of Home, Services, and Contact.
- [ ] Approve typography, spacing, illustration, palette, navigation, and responsive behavior.
- [ ] Complete manual screen-reader, keyboard, 200% zoom/reflow, contrast, and reduced-motion review.
- [ ] Review any accessibility exceptions. Automated scores do not certify WCAG compliance.

## Forms and privacy

- [ ] The owner creates/configures the intended Formspree Free account and public endpoint.
- [ ] Verify dated official quota, retention, storage, notification, spam, validation, and AJAX/CORS terms.
- [ ] Confirm that expected inquiry volume fits the free plan and agree on monitoring and overflow handling.
- [ ] Approve the final privacy policy against actual provider configuration, retention, and deletion procedures.
- [ ] Verify a real test inquiry appears in provider storage with the correct category/context.
- [ ] Independently verify delivery to the owner's notification inbox.
- [ ] Test provider rejection and recovery in a real staging context.
- [ ] Verify spam controls and provider-side validation.
- [ ] Delete test records and email copies using the documented process.
- [ ] Accept the lack of a durable CRM or verified automatic visitor acknowledgment.

## Hosting and operations

- [ ] Review the current Pages host, HTTPS enforcement, DNS, and redirects.
- [ ] Decide how historical URLs should be retained, archived, redirected, or retired.
- [ ] Keep a durable, verified legacy archive and the previous deployable artifact.
- [ ] Review branch protection, deployment permissions, and the full-launch release policy.
- [ ] Rehearse restoration of the intended rollback artifact and hosting configuration.

## Full launch verification

- [ ] Run the fully approved production build rather than deploying a preview or prelaunch artifact.
- [ ] Recheck automated journeys, validation, errors, neutral direct confirmation visits, routes, links, and assets.
- [ ] Verify mobile Lighthouse targets on the final content and deployed configuration.
- [ ] Review SEO metadata, canonical URLs, sitemap, indexing policy, and social metadata.
- [ ] Recheck dependency risk and generated-output secret/placeholder checks.
- [ ] The owner approves the exact full-launch content and commercial release.
- [ ] Enable inquiries only after the actual provider, privacy, and delivery checks pass.
- [ ] Verify the live full-launch site, form behavior, HTTPS, and rollback readiness.

## Evidence already available

- [x] Legacy Git history bundled, verified, and restored in a disposable bare repository before implementation.
- [x] Static Astro/TypeScript/Tailwind implementation and pinned dependency installation verified locally.
- [x] Local baseline passed 42 unit tests and 48 browser scenarios before adding the public checklist.
- [x] Production guard tested through actual rejected and synthetic approved builds.
- [x] Responsive overflow fixed and checked at 320, 390, 768, and 1440 pixels.

Current-run results, screenshots, and remaining limitations are recorded in `docs/REVIEW.md` and the generated test reports. Public prelaunch publication is not evidence that the full launch checklist is complete.
