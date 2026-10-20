# Milestones, dependencies, and launch gates

## M0 — Approval and repository reconnaissance (no publication)
- [ ] Confirm exact GitHub owner/repository and inspect existing site, DNS, workflows, and files.
- [ ] Document preservation/rollback approach and obtain approval to replace published site.
- [ ] Confirm that Astro/Tailwind/GitHub Pages remain viable with current versions.
- [ ] Verify Formspree Free limits/features and $0 operating assumption.
**Exit:** Owner approves architecture and repo replacement plan. No deletions or deployment.

## M1 — Content and identity approval
- [ ] Obtain exact public full name, descriptor, biography, contact and notification email.
- [ ] Approve service package inclusions/exclusions, provisional prices, and clarification follow-up terms.
- [ ] Approve privacy notice, provider disclosure, retention/deletion procedure.
- [ ] Approve content for Home, Services, About, Contact; optional initial Resources.
**Exit:** No unresolved production placeholders or unapproved factual claims.

## M2 — Design system sign-off
- [ ] Propose sans-serif fonts and accessibility-tested palette variants.
- [ ] Produce desktop/mobile previews for Home, Services, Contact.
- [ ] Approve hero illustration style, card styles, navigation, responsive layout.
**Exit:** Owner signs off design previews and component standards.

## M3 — Foundation and CI
- [ ] Create approved Astro + TypeScript + Tailwind structure on feature branch.
- [ ] Configure static root-path build, content data, metadata, lint/typecheck/tests.
- [ ] Set GitHub Actions PR checks and approved-merge deployment; document protections and rollback.
- [ ] Implement fail-closed production placeholder/approval checks.
**Exit:** CI passes; no production deployment until authorized.

## M4 — Pages and content
- [ ] Implement Home, Services, About, Contact, thank-you, privacy, 404; resources index only if approved.
- [ ] Add both visitor paths, service anchors, illustrative examples, and CTA navigation.
- [ ] Ensure content is editable through Markdown/typed config without layout edits.
**Exit:** Approved page copy and responsive design verified.

## M5 — Form integration
- [ ] Owner creates/configures Formspree account and supplies public endpoint securely.
- [ ] Implement adaptive accessible form, validation, submit states, failure handling, retry, email fallback.
- [ ] Verify actual provider acceptance, storage, owner notification, spam settings, and thank-you behavior.
- [ ] Document lack of native free autoresponder and durable CRM; do not promise them.
**Exit:** Live-equivalent end-to-end tests pass and privacy workflow approved.

## M6 — QA and launch
- [ ] Complete automated and manual tests in TESTING.md.
- [ ] Review SEO, mobile performance, accessibility, dependency risk, and content approvals.
- [ ] Owner reviews final PR and explicitly authorizes merge/release.
- [ ] Verify deployed site, forms, domain, and rollback.
**Exit:** Production release confirmed by owner and tested. Record deferred work.

## Deferred backlog (not authorized at launch)
- Booking/calendar and payment checkout.
- Automatic acknowledgment email if it requires paid tier.
- Long-term inquiry archive/status CRM beyond provider's free retention.
- Interactive AI demos, analytics, advanced resources library.
- Custom domain or new hosting platform.
- Personal headshot when supplied and approved.

## Open issues and decision log
| Issue | Owner action | Blocking stage |
|---|---|---|
| Full public name/descriptor | Provide and approve | Production |
| Biography/experience claims | Supply and approve | About/publication |
| Public and notification emails | Provide | Form/publication |
| Service prices and policies | Explicit approval | Services/publication |
| Existing root repo replacement | Inspect and approve preservation | Repo changes |
| Formspree endpoint and plan verification | Create/configure/approve | Form integration |
| Privacy notice and retention process | Approve accurate policy | Form/publication |
| Font and final contrast tokens | Approve preview | Design release |
| Durable lead records beyond free retention | Accept limitation or change provider | Business operations; not a launch blocker if limitation accepted |
