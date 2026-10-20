# Solo AI consulting website: Codex handoff

**Status:** The owner has authorized incremental public prelaunch publication. Full commercial launch still requires the outstanding content, design, privacy, and provider checks in [the full launch checklist](PRODUCTION_CHECKLIST.md). No external form account has been configured.

## Run and review

Use Node from `.node-version`, then run `npm ci` and `npm run dev`. Run `npm run build:preview` for a labelled, nonindexed review build. `npm run build:prelaunch` produces the publicly publishable prelaunch with inquiries disabled and a public checklist. `npm run build` remains the fully approved commercial-launch build and intentionally fails until the approvals in `src/content/approval.json` are complete.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:release`, and `npm run test:e2e`. Install Playwright Chromium with `npx playwright install chromium`. If this cloud machine supplies Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for browser tests.

See [development and release operations](docs/OPERATIONS.md) for preservation, provider verification, and publication gates. The specification below remains authoritative. Business details and approval flags must only be updated from owner-approved facts.

## Read order
1. `SPEC.md` — product requirements and scope
2. `CONTENT.md` — approved messaging, provisional offers, and content controls
3. `DESIGN.md` — visual identity and component requirements
4. `ARCHITECTURE.md` — stack, forms, security, deployment
5. `TESTING.md` — objective acceptance criteria
6. `AGENTS.md` — Codex operating instructions and approval gates
7. `TASKS.md` — ordered, reviewable implementation milestones

## Authority and decision status
- **Approved:** strategy, audiences, website goals, page structure, headline and visitor paths, visual direction, static hosting, inquiry-only conversion, controlled agent autonomy.
- **Selected implementation defaults (subject to technical verification):** Astro, strict TypeScript, Tailwind, Formspree Free, GitHub Actions.
- **Provisional:** prices ($149 / $150 per 60 minutes / $225 per 90 minutes / $399), total service economics and exact delivery policies, fonts and accessibility-adjusted colors.
- **Approval-required placeholders:** public full name, exact professional descriptor, personal biography, contact email, notification email, actual Formspree endpoint, privacy contact details.
- **Deferred:** booking, payment, native automatic acknowledgment if paid, durable CRM beyond free retention, interactive demos, analytics, custom backend, client portal.

## Stop condition
The owner has authorized ongoing labelled prelaunch publication while the full launch gates remain open. Publish those updates using `npm run build:prelaunch` and keep the remaining checks visible at `/launch-checklist/`. Resolve `PRODUCTION_CHECKLIST.md` before the full commercial launch. Placeholder copy and provisional prices must never be presented as factual production content.
