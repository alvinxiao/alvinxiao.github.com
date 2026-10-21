# Practical AI

Practical AI is Alvin's consulting and education website for small business owners who want to understand AI and automation, explore what could help their work, and get support putting useful ideas into practice.

The site starts with the business problem. That might mean learning how to use an AI tool, reducing repetitive work, organizing information, or improving an existing process. A template, spreadsheet, or simpler workflow may be a better answer than AI.

**Website:** [alvinxiao.github.io](https://alvinxiao.github.io/)

## Who it helps

The site offers two starting points:

- **I'm new to AI:** Plain-language explanations, practical examples, and help getting comfortable with the tools. No programming background is required to begin exploring.
- **I have a problem to solve:** A conversation about a specific task or workflow, possible approaches, and what would make an improvement worthwhile.

Alvin is a software engineer and program manager with 15 years of experience. His approach emphasizes teaching, breaking down complex problems, and helping people make informed choices without jargon or pressure to adopt AI.

## What the site offers

- **AI Getting Started:** Personalized education, examples relevant to the business, and a one-page guide.
- **AI Problem-Solving:** Focused advice on a specific challenge, possible tools and approaches, and a brief written recap.
- **AI Workflow Audit:** Review of one agreed workflow with written findings about potential improvements.
- **Custom Automation:** Separately scoped implementation with agreed deliverables before work begins.

Public prices are omitted. Scope, cost, timing, and terms are agreed before paid work begins. The site does not take bookings or payments.

The [Resources section](https://alvinxiao.github.io/resources/) includes guides to AI basics, a first experiment using fictional information, and choosing between templates, rule-based automation, and AI. Examples are illustrative rather than client case studies. Human review remains part of the proposed workflows.

## Current status

The website is a public **prelaunch preview**. Visitors can explore the pages and articles, but inquiry submission is disabled and search indexing is blocked. Contact details, provider setup, privacy terms, working policies, and final launch reviews remain pending.

Incremental prelaunch updates are authorized. The [full launch checklist](PRODUCTION_CHECKLIST.md), also available [on the website](https://alvinxiao.github.io/launch-checklist/), records the work required before enabling inquiries and completing the commercial launch.

## Develop locally

Use the Node version in `.node-version`.

```sh
npm ci
npm run dev
```

To review the same prelaunch mode used by the public site:

```sh
npm run build:prelaunch
npm run preview -- --ignore-lock
```

The site uses Astro, strict TypeScript, and Tailwind CSS. Articles are Markdown files in `src/content/resources/`. Business facts and approval flags live in `src/content/approval.json`.

### Build modes

| Command                   | Purpose                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run build:preview`   | Local editorial and functional review, including synthetic form testing                          |
| `npm run build:prelaunch` | Public prelaunch with disabled inquiries, no indexing, and output safety checks                  |
| `npm run build`           | Full commercial release; intentionally blocked until required content and approvals are complete |

GitHub Actions builds and publishes the prelaunch to GitHub Pages when changes reach `master`. Formspree is the selected inquiry provider, but its account, endpoint, and notification delivery still require setup and verification.

### Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:release
npx playwright install chromium
npm run test:e2e
```

If the cloud environment supplies Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for browser tests. See [development and release operations](docs/OPERATIONS.md) for provider verification, preservation, publishing, and rollback procedures.

## Contributions and planned improvements

All changes, including documentation and reverts, go through a feature branch and pull request. Each PR requires owner approval before merge or auto-merge. UI changes include before-and-after screenshots and a motion recording for review. Link the relevant issue and include verification evidence so the change remains traceable.

The [motion backlog](docs/MOTION_BACKLOG.md) records the current animation audit, Astro theme references, priorities, and linked GitHub issues. These are proposed improvements for future PRs.

## Project specifications

These documents define the project requirements. Apply subsequent owner-approved decisions recorded in the repository and conversation when they supersede an earlier proposal.

| Document                           | Contents                                             |
| ---------------------------------- | ---------------------------------------------------- |
| [SPEC.md](SPEC.md)                 | Audience, goals, scope, and product requirements     |
| [CONTENT.md](CONTENT.md)           | Messaging, service outlines, and content decisions   |
| [DESIGN.md](DESIGN.md)             | Visual direction and component requirements          |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Static architecture, forms, security, and deployment |
| [TESTING.md](TESTING.md)           | Acceptance criteria and verification requirements    |
| [AGENTS.md](AGENTS.md)             | Contributor instructions and approval rules          |
| [TASKS.md](TASKS.md)               | Implementation milestones                            |

Unapproved prices, invented credentials, and unresolved business details must not be presented as approved launch content. Publishing a prelaunch update does not authorize activating the inquiry form or completing the full launch.
