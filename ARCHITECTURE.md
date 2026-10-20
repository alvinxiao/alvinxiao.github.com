# Technical architecture and operations

## Selected stack
- Astro static-site generation; TypeScript strict mode.
- Tailwind CSS plus CSS custom properties for design tokens.
- Markdown for resource articles; typed service/site configuration for approved business facts.
- Minimal browser JavaScript for adaptive form, validation, submit state, and success handling; no React runtime unless a documented need emerges and is approved.
- GitHub Pages repository `alvinxiao/alvinxiao.github.com`, public host `alvinxiao.github.io`, canonical base path `/` (verify repository and owner settings before implementation).
- GitHub Actions builds/tests and deploys after owner-approved PR merge into the production branch.
- Formspree Free selected initial inquiry backend. No self-hosted API, database, authentication, or payment service.

## Repository safety and deployment
Inspect current repo and published site first. Inventory existing files, history, workflows, domains and DNS; confirm whether other content would be lost. Create recoverable snapshot/branch/tag before replacement. Work on feature branches and PRs. CI on PR; deployment only after merge with explicit owner approval. If branch protection cannot be enforced due to plan/settings, document and use manual review safeguards. Do not delete unrelated content without owner confirmation. Provide rollback instructions and verify deployed site.

## Formspree integration
Use a public form endpoint identifier configured per environment. No private tokens in static output, commits, logs, or screenshots. Form service must be tested in a real staging/preview context before release; confirm current free-tier quota, retention, notification rules, spam features, CORS/AJAX response semantics, and any required attribution or verification. The site's own thank-you navigation follows a confirmed successful provider response; do not assume native free-plan redirect/autoresponder. Handle throttling, quota exhaustion, provider downtime, malformed responses, timeouts, validation failures, and duplicate-click prevention. Never automatically submit again after ambiguous network failure without warning of potential duplicate. Provide an accessible mailto fallback.

### Data contract (conceptual)
`name`, `email`, `interest`, `description`, `optional_context`, `source_service`, `submitted_at` (provider metadata if available). Avoid collecting IP/location explicitly, attachments, secrets, client records, payment data, or detailed budget. Normalize allowed interest values. Do not place submitted content in URL query strings, analytics events, or browser console logs. Avoid relying on client-only anti-spam measures; enable provider-supported filtering and a honeypot if compatible.

## Email and tracking
Owner notification required; personally reply from chosen email. Native automatic visitor acknowledgment deferred under $0 budget unless verified free. Provider dashboard + email are the launch tracking workflow. Formspree Free retention and lack of durable export are known constraints to verify; do not claim a durable CRM. If durable records become a hard requirement, pause and obtain approval for a revised provider/workflow. Document manual retention/deletion handling for both provider and inbox.

## Privacy and security
Use HTTPS. External scripts minimized; set sensible security headers where supported by GitHub Pages, acknowledging hosting limitations. No secrets in public repository or client bundles. Pin dependencies/lockfile; automated dependency review if available. Add spam controls and request size limits where provider permits. Link an accurate privacy notice, provider disclosure, contact for deletion, and retention policy approved by owner. No unverified compliance claims.

## SEO and accessibility
Semantic HTML, canonical root URL, descriptive page titles/meta descriptions, sitemap, robots.txt, OG metadata, useful alt text, accessible navigation and forms. Do not index placeholder pages. Respect reduced motion. Keep resource URLs stable and links validated.

## Environment/configuration
Centralize public site URL, public form endpoint, approved business identity, services, and feature flags. Add fail-closed build checks: required public identity missing, unapproved pricing flag, unresolved placeholder tokens, missing form endpoint, or unpublished privacy notice must block production release. Preview builds may use development placeholders but must be labeled nonproduction.

## Zero-cost constraint
Target $0 recurring platform spend using GitHub Pages and Formspree Free within verified limits. Do not create paid accounts, upgrade plans, or introduce paid APIs without approval. Third-party plan terms and quotas can change; verify at implementation and document date/source. No analytics at launch.

## Incremental prelaunch publication

The owner has authorized public progress updates before the full production checklist is complete. Publish the explicitly labelled `build:prelaunch` output through the prelaunch Pages workflow, keep inquiries disabled, and expose pending gates at `/launch-checklist/`. The normal `build` command continues to enforce the full commercial-launch approvals. See `PRODUCTION_CHECKLIST.md` and the current directive in `AGENTS.md`.
