# Codex operating rules

## Current owner publication directive

The owner has explicitly authorized full implementation and incremental public prelaunch publication, including while the full production approval gates remain open. Publish progress as a clearly labelled prelaunch site and record outstanding gates in `PRODUCTION_CHECKLIST.md` and `/launch-checklist/`. This standing authorization covers the merges and GitHub Pages deployments needed for those prelaunch updates. Keep inquiries inactive in prelaunch builds and do not invent business facts, prices, qualifications, or provider verification. Full commercial launch remains a separate checklist decision. This directive overrides the earlier publication pauses below for prelaunch updates only.

## Pull request workflow

Every future change must go through a feature branch and a pull request targeting `master`. This includes documentation, fixes, and reverts. Each commit must belong to a PR before it reaches `master`; do not commit or push changes directly to `master`.

Link the relevant backlog issue, describe the scope and verification, and include screenshots or recordings for UI changes. A PR may auto-merge under the owner's standing prelaunch authorization after its checks pass and review findings are resolved. Auto-merge does not replace the PR record or authorize the full commercial launch. Keep unrelated work in separate PRs.

## Mission and authority
Implement only the approved solo AI consulting pre-launch website described in this package. This document does **not** authorize coding, repo modification, external account creation, or deployment until the owner explicitly starts implementation. The user's approval is required before any production publication.

## Work protocol
1. Read README, SPEC, CONTENT, DESIGN, ARCHITECTURE, TESTING, TASKS in order.
2. Inspect repo before changes; report current state and risks; do not delete existing material blindly.
3. Propose milestone plan, files to change, tests, and open questions before each milestone.
4. Implement one bounded milestone per feature branch/PR, unless owner approves a different split.
5. Run relevant tests and provide concise PR summary, screenshots/previews, unresolved risks, and approval requests.
6. Never merge/deploy on behalf of owner without explicit authorization.

## Allowed autonomy
Choose routine component APIs, folder structure, responsive implementation, code organization, and testing mechanics within the approved stack and design. Propose specific fonts and accessible token adjustments for owner approval. Use independent subagents only for genuinely separable tasks, without shared mutable-file conflicts.

## Must escalate
Any change to business identity, biography, qualifications, service prices or scope, claims, guarantees, privacy text, external providers, recurring costs, hosting, major layout direction, page scope, deployment policy, or data collection/retention. Escalate if Formspree Free cannot meet required notifications/storage, if existing repo content would be destroyed, or if quality gates cannot be met.

## Forbidden
Invent testimonials, clients, credentials, results, or prices. Publish placeholders or provisional prices. Commit private keys or credentials. Create paid accounts or paid services. Build an unapproved custom backend, CRM, payment system, booking system, or chatbot. Assume a successful email notification from an accepted form submission. Claim WCAG compliance solely from a Lighthouse score. Change public website without review.

## Communication style
Be direct, plain-language, concise. Distinguish facts from assumptions, recommendations, and blocked requirements. Avoid unnecessary AI-sounding marketing copy and em dashes in published copy. Ask focused questions only when decisions are genuinely blocking.

## Completion evidence
Each PR must include changed-file summary, acceptance criteria mapping, test commands/results, accessibility/performance notes, screenshots for UI work, placeholder/approval status, and known limitations. No 'done' claim without verified evidence.
