# Copy the fictional practice prompts

Issue #25 adds a small Copy prompt control to the three existing practice instructions: one in AI Basics and the first-draft and revision instructions in Getting Started. Explicit authored wrappers mark those prompts. Ordinary quotations receive no control.

The control copies only the visible blockquote text. “Copied.” appears only after the browser’s write operation resolves. Pending writes keep keyboard focus and ignore repeated activation. Missing or rejected clipboard access shows “Could not copy. Select the prompt and copy it.” The site never reads the clipboard, calls an AI provider, or stores copied information.

Without JavaScript, every prompt remains fully visible and selectable, with no dead copy button. A 44px control slot is reserved in the card to avoid initial control insertion moving the following article text. The no-JavaScript view keeps that space as a bottom gutter. Longer error feedback can expand the row after an explicit user action.

## Before and after

Baseline: master `031a06c`, including the approved selection-spacing fix from PR #33. PR #32’s contents navigation is separate and is not included here.

| Prompt | Before, phone | After, phone |
| --- | --- | --- |
| Basics | [Before](before/ai-basics-0-390.png) | [Copied](after/ai-basics-0-copied-390.png) |
| First draft | [Before](before/getting-started-0-390.png) | [Copied](after/getting-started-0-copied-390.png) |
| Revision | [Before](before/getting-started-1-390.png) | [Copied](after/getting-started-1-copied-390.png) |

[Phone video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [simulated rejection video](videos/denied-diff.mp4), [JavaScript-disabled video](videos/no-javascript-diff.mp4).

Successful recordings use the real Clipboard API and verify the actual clipboard contents. The rejection scenario deliberately supplies a rejecting API fixture and labels that simulation. Review iframes explicitly allow clipboard access; the actual website presents the controls directly in its article page.

Fallback screenshots: [Rejected copy](after/denied-390.png), [no JavaScript](after/no-javascript-390.png).

## Verification

All eight copy-control browser checks pass. They verify actual clipboard contents for all three approved prompts, keyboard and touch activation, no network requests on copy, a delayed write with repeated activation, focus retention, missing and rejecting APIs, unmarked quotations, JavaScript disabled, reduced motion, and 320/390/768/1440px layouts. The actual clipboard tests also insert hidden fixture text and confirm it is not copied.

All three guide accessibility/link scans pass. Typecheck, lint, formatting, 44 unit tests, and the 12-page prelaunch build pass. [Capture evidence](verification.json) compares original article text, heading IDs, and prompt text across both affected guides at every captured width. [Bundle inventory](bundles.json) records the deliberately added small browser controller. Asset sizes are not performance measurements.

Independent source review found no material issue. Evidence uses Chromium/Linux. Real-device, other-engine, native zoom, operating-system permission dialogs, and screen-reader output remain unverified. Automated scans do not establish WCAG compliance. No article wording, provider, dependency, inquiry activation, or commercial-launch approval changes.

## Throughput checkpoint

- Blocking first steps: inspect the three authored prompts, merge approved PR #33, preserve its baseline, and choose explicit prompt markup rather than guessing from all blockquotes.
- Independent workstreams: one source owner changes the marked Markdown, controller, scoped CSS, and article import; parent owns browser tests, capture, evidence, and PR; independent review is read-only.
- Shared mutable state: baseline has its own build/server. Candidate tests, prelaunch build, and media capture run sequentially. Each control owns its own pending state.
- Smallest safe decomposition: native buttons and one small browser module supply the requested clipboard action without a new dependency or provider.

Prove It Works shapes verification: read the actual clipboard in isolated browser contexts and compare it with the approved prompt, rather than treating a success label as evidence of copying.

Reproduce with prelaunch builds of `031a06c` and this revision on ports 4354 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-copy-prompts-review.mjs`.

Keep this PR unmerged with auto-merge off until owner visual approval.
