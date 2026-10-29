# Resource-guide contents navigation

Issue #24 adds an in-flow “On this page” navigation block to each resource guide. Astro’s rendered Markdown headings provide the link text and fragment IDs. There is no second handwritten list and no new browser script.

The block uses two columns on wider screens and one on phones. Links use 16px text and at least 44px of target height. A 32px heading scroll margin leaves room above native fragment destinations. All resources navigation, article text, existing section IDs, guide URLs, artwork, and prelaunch safeguards remain intact.

## Design choice

A small in-flow list keeps the guide structure available without a sticky sidebar or an overlay. The shared article template owns both rendering and its headings, so a separate navigation data model or component would add another place to maintain the same information. Existing numbered Getting Started headings retain their own numbers rather than gaining a second list numbering scheme.

The new label is “On this page.” No article or business copy changes. Owner visual and editorial review is required before merge.

## Before and after

Baseline: merged master `373be53`, including the approved workflow from PR #31.

| Guide | Before, phone | After, phone | After, desktop |
| --- | --- | --- | --- |
| AI basics | [Before](before/ai-basics-390.png) | [After](after/ai-basics-390.png) | [Desktop](after/ai-basics-1440.png) |
| First experiment | [Before](before/getting-started-390.png) | [After](after/getting-started-390.png) | [Desktop](after/getting-started-1440.png) |
| Workflow choices | [Before](before/workflow-390.png) | [After](after/workflow-390.png) | [Desktop](after/workflow-1440.png) |

[Phone video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [reduced-motion video](videos/reduced-motion-diff.mp4), [JavaScript-disabled video](videos/no-javascript-diff.mp4).

Video chapters label keyboard activation, the native section jump, and Browser Back. They show actual builds. The previous page has no contents control; the revised page offers the native link. No scripted jump is presented as automatic playback.

## Verification

All 11 targeted browser checks and all three resource-guide accessibility/link scans pass. Typecheck, lint, formatting, 44 unit tests, and the 12-page prelaunch build pass. [Capture evidence](verification.json) compares original article text, heading labels and IDs, and external script URLs across all three guides at 320, 390, 768, and 1440px. It checks every new link against its actual destination and records no horizontal overflow.

Browser checks cover matching headings, keyboard and pointer activation, direct fragments, Back and Forward, All resources navigation, JavaScript disabled, reduced motion, touch, target size, and reflow. History tests allow native focus scrolling to settle before activating another fragment, then check the actual stored scroll position rather than assuming a previous heading remains on screen.

Independent source review found no substantive implementation issue. Chromium/Linux evidence does not verify Safari, Firefox, native zoom, real devices, or screen-reader output and does not establish WCAG compliance. The normal CI suite remains required before approval.

Prove It Works shaped validation: compare built article text and IDs against the baseline and exercise real native fragment links, not a simulated navigation handler.

## Throughput checkpoint

- Blocking first steps: inspect the article renderer and issue acceptance criteria, merge approved PR #31, and preserve a separate baseline build.
- Independent workstreams: one source owner changes only the shared article template; parent owns browser tests, capture helper, evidence, and PR; independent source review is read-only.
- Shared mutable state: baseline has a separate build and server. Candidate tests, prelaunch build, and recordings run sequentially against generated output.
- Smallest safe decomposition: one template derives links from the headings it already renders. No new island, scroll controller, provider, dependency, or content schema is needed.

Reproduce with prelaunch builds of `373be53` and this PR, served on ports 4352 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-resource-contents-review.mjs`.

Keep this PR unmerged with auto-merge off until the owner reviews the screenshots and recording. PRs #28 and #30 remain separate.
