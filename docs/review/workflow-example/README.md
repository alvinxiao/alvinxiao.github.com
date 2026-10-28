# Hands-on workflow example review

Issue #23. This independent branch starts at master `e9cf78be16adc0cf5b7116118ff580f720f78696`. PRs #28 and #30 remain separate and unmerged. Owner approval is required before merge.

## Choose the customer need

A visitor selects standard collection hours, whether an order is ready, or an unusual request. The explanation compares a clear answer/template, a rule-based notification, or a human-reviewed AI draft. The explanations and caveat are verbatim excerpts from the existing workflow article. This is illustrative educational content. No AI, provider, or personalized advice call occurs.

The native radio group owns selection. CSS derives which explanation is visible. The longest explanation reserves the panel height, so switching choices leaves controls, panel bounds, and the article link stationary. There is no new JavaScript, dependency, animation, timed cycling, data collection, or stored selection.

All three original example rows remain, with the interaction inserted after the first. The existing hero workflow, pause control, service links, biography, branding, and disabled prelaunch inquiries are preserved.

## Prototype decision

| Design | Phone | Desktop | Decision |
| --- | --- | --- | --- |
| Native choices with one explanation | [390px](prototypes/choice-390.png) | [1440px](prototypes/choice-1440.png) | Selected. One need and its explanation are visible together. |
| Three initially open disclosures | [390px](prototypes/disclosures-390.png) | [1440px](prototypes/disclosures-1440.png) | More simultaneous reading, especially on a narrow screen. |

Both actual prototypes were rendered at 320, 390, and 1440px. [Prototype metrics](prototypes/metrics.json) record no horizontal overflow. The choice prototype measured 1080px tall at 390px, compared with 1812px for the open disclosures. These are rendered layout measurements, not comprehension scores or performance results. Selection reflects visual review rather than user research.

The [choice HTML](prototypes/choice.html) and [disclosure HTML](prototypes/disclosures.html) are retained for reproduction. Production removes selected-only bold text after actual measurements showed it changed control widths on desktop and heights at 320px. Every control rectangle is now checked across all three selections. The native checked dot, border, and background still identify selection without depending on color alone.

Exhaust the Design Space led to the two rendered alternatives. Model the Domain kept selection in the native mutually exclusive radio group. Prove It Works led to geometry, keyboard, fallback, excerpt-provenance, and actual recording checks.

## Copy requiring owner review

The new UI copy is the legend and three short control labels:

- What does the customer need?
- Standard collection hours
- Whether an order is ready
- An unusual request

The question, caveat, explanation headings, first two paragraphs for each approach, and guide title come from `src/content/resources/workflow.md`. The provenance unit check fails if those explanations stop matching their article sections. No service claim, result, testimonial, qualification, price, or guarantee is added. Approving this PR reviews these control labels before any publication.

## Throughput checkpoint

- Blocking first steps. Inspect the authoritative documents, existing examples, workflow article, and native interaction constraints. Render both alternatives before selecting one.
- Independent workstreams. One prototype owner creates standalone HTML. One implementation owner edits the component, content registry, Home insertion, and tests. Parent owns builds, recordings, and PR. An independent reviewer checks source without writing.
- Shared mutable state. Tests, candidate builds, and media capture serialize because they share generated output. Baseline output is a separate temporary snapshot.
- Smallest safe decomposition. One scoped component and a three-case excerpt registry are sufficient. Native controls remove the need for a JavaScript state controller or framework.

## Verification boundaries

Keyboard arrows and Space, touch, reduced motion, no JavaScript, readable text at least 15px, 44px minimum targets, stable control/panel/link geometry, no new requests during selection, and no overflow at 320/390/768/1440px are browser checks. The existing eight hero workflow checks remain in the targeted run.

No JavaScript still gives the complete native interaction. If `:has()` is unsupported, the controls are hidden and all three explanations remain readable. Removing only the component's selection-enhancement CSS rules simulates that fallback in Chromium. Disabling styles also leaves all explanations and the article link in document order. This does not establish behavior in an actual older engine.

Evidence uses Chromium on Linux. Native browser zoom, real devices, other engines, and screen-reader operation remain unverified. The example adds vertical reading distance to Home; all original material is retained rather than deleted to offset it. It is not a live AI demo.

## Reproduction

Build the baseline and candidate with `npm run build:prelaunch`. Serve baseline on port 4342 and candidate on port 4340. Run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-workflow-example-review.mjs`. The helper recreates both prototype captures, before/after examples, each choice, keyboard focus, simulated static fallback, and matching-viewport recordings.

Keep auto-merge disabled. The owner must review the screenshots, recordings, new control labels, and PR checks before merge. Existing Services interaction investigation #29 is separate.

## Before and after evidence

| View | Before | After |
| --- | --- | --- |
| Phone example area | [Original rows](before/examples-390-complete.png) | [Rows with the worked example](after/examples-390-complete.png) |
| Desktop example area | [Original rows](before/examples-1440-complete.png) | [Rows with the worked example](after/examples-1440-complete.png) |
| Narrow phone | [Context](before/examples-320-context.png) | [FAQ choice](after/example-320-choice-1.png) |

Choices at 390px: [FAQ/template](after/example-390-choice-1.png), [notification](after/example-390-choice-2.png), and [reviewed draft](after/example-390-choice-3.png). Also inspect [keyboard focus](after/keyboard-focus-390.png) and [the simulated static fallback](after/selection-enhancement-removed-390.png).

Recordings: [Phone before/after](videos/phone-diff.mp4), [desktop](videos/desktop-diff.mp4), [reduced motion](videos/reduced-motion-diff.mp4), and [no JavaScript](videos/no-javascript-diff.mp4). The phone recording uses a clearly labelled 390×1100 viewport to show controls and the explanation together. Compact 320×640 and 390×844 layouts are covered separately in screenshots. Recordings compare visual behavior rather than timing or performance.

[Verification](verification.json) records 14 targeted browser passes, with no failures or retries; typecheck has zero errors, warnings, or hints. ESLint, Prettier, 45 unit tests, and the 12-page prelaunch check pass. [Layout evidence](layout-evidence.json) confirms all original example row text matches baseline at every captured width. Hero opening screenshots are byte-identical at 320, 390, 768, and 1440px.

The external stylesheet total grows from 33,028 to 33,081 bytes. Home also gains 3,048 bytes of inline component CSS; its generated HTML grows from 23,706 to 30,540 bytes including that CSS and the new content. All three external JavaScript hashes and Home inline scripts match baseline. These bundle counts do not establish performance results.

The initial test runner configuration imported an Astro-only module and failed before assertions. It now checks the published original titles directly, while the media helper compares the complete original row text against baseline. An initial request assertion also caught the page's deferred favicon rather than a control request. The corrected assertion starts after initial network activity settles, then observes no requests during choices. Type errors in test measurements were corrected. The final targeted run is the reported result.

Independent review identified selected-only font weight as a cause of moving controls. [Pre-fix geometry](controls-before.json) records that reproduction. Production uses constant weight, and the browser test now compares every control rectangle as well as panel height and guide position across selections. No test assertions were suppressed to obtain the final pass.
