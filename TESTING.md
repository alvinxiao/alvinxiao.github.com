# Verification and acceptance plan

## Quality targets (proposed measurable gates, subject to implementation verification)
- Lighthouse mobile performance >=90 on Home, Services, Contact in a repeatable production-like run.
- Lighthouse accessibility >=95 on those pages; automated score does **not** establish WCAG compliance.
- WCAG 2.2 AA-oriented manual checks for keyboard, focus, labels, contrast, zoom/reflow, screen reader basics, error handling, and reduced motion.
- No horizontal overflow at 320px and common phone/tablet/desktop widths; test 200% zoom and mobile landscape.
- Unique metadata, correct canonical URLs, sitemap, no broken internal links, no missing assets, valid root-path routing.
- Build, typecheck, lint and automated tests pass in CI; no critical/high known dependency issue unreviewed.

## Required automated test scenarios
1. Navigation and internal links from each visitor path to the intended service section and contact page.
2. Service CTA preselects the correct interest; visitor can change it.
3. Form required-field, email-format, length, and invalid-state handling; keyboard and accessible error messaging.
4. Conditional field shown/hidden correctly and irrelevant hidden data not submitted.
5. Submission pending state disables duplicate click; provider success navigates to thank-you.
6. Provider 4xx/5xx, timeout, rate limit, offline, ambiguous response: preserve inputs, show clear error/retry, email fallback; no false success.
7. Direct thank-you URL visit does not falsely claim a submitted inquiry.
8. No sensitive values in query parameters, logs, or analytics; no private keys in built assets.
9. Production build fails on unresolved placeholder tokens, unapproved price flags, missing required identity/contact data, or absent privacy approval.
10. Visual regression/screenshot review for representative mobile and desktop views; reduced-motion behavior.

## Manual external-service verification
Submit at least one real test inquiry to configured Formspree endpoint; confirm dashboard record, owner notification, accurate selected interest/context, spam filtering configuration, and success page. Test rejection/failure without losing input. Verify current free quota and retention. Delete test inquiry and email copies per documented process. Verify that no automatic visitor acknowledgment is promised or shown unless truly configured.

## Content and editorial acceptance
Compare homepage hero, visitor paths, service summaries, and CTAs against `CONTENT.md`. Confirm no em dashes in marketing copy; no fake clients, testimonials, certifications, ROI, or guarantees; examples labeled hypothetical; personal facts approved. All published service prices and policies approved in writing. About page has approved real bio or is intentionally omitted with owner approval. No development placeholders.

## Release sign-off
Owner reviews PR diff, visual previews, approved content checklist, external provider test results, accessibility exceptions, and deployment plan. Merge only after explicit approval. Confirm live domain, HTTPS, page routes, form success/failure, and rollback procedure after deploy. Document remaining limitations (no booking, no automatic acknowledgment, no long-term CRM).
