# Shorter visual workflow example

This revises PR #31 after review of the long explanation selector. The comparison baseline is that PR's first version, `943753c`, rather than the published site. The PR still adds the worked example beneath the first existing example row, with all three original rows preserved.

## What changed

Choose a customer question and see a concrete message, a small information card, and a reply bubble. A finite connector draw shows the relationship between information and reply. The text stays stationary. Native selected states, icons, contrasting surfaces, and restrained hover/focus feedback replace the long article excerpts.

The visible widget text falls from 112–118 words to 45–62 words depending on the selected case. Counts include the heading, caveat, controls, selected content, note, and article link, split on whitespace. These are layout/content observations, not a readability study or performance measurement. At 390px the widget is 833px tall instead of 919px. At 320px it is 912px instead of 1029px. It remains a scrollable part of the page rather than forcing everything above the fold.

The radio group owns selection. Shared natural subgrid tracks keep the question, information card, reply, controls, and article link in place across selections without fixed clipping heights. The connector runs once for 560ms after selection and ends with a complete arrow. Reduced motion shows that arrow immediately. No JavaScript, provider call, stored selection, or data collection is added. Network observation starts after focus-scroll and initial lazy assets settle, then covers the actual choice changes.

## Alternatives

| Design | Phone | Desktop | Decision |
| --- | --- | --- | --- |
| One question, information, and reply | [A at 390px](prototypes/a-390-request.png) | [A at 1440px](prototypes/a-1440.png) | Selected. Keeps one concrete example in view. |
| Three approach lanes | [B at 390px](prototypes/b-390-request.png) | [B at 1440px](prototypes/b-1440.png) | Too much simultaneous reading for this revision. |

Both rendered prototypes were inspected at 320, 390, and 1440px. [Prototype metrics](prototypes/metrics.json) show no horizontal overflow. Standalone [A HTML](prototypes/a.html) and [B HTML](prototypes/b.html) are retained. Production shares natural grid tracks across cases to keep internal cards stable. Visual review also caught an inherited dark icon on the dark reply card; its local color now follows the light heading.

Experience First favored showing a result over preserving the earlier excerpt-only implementation. Exhaust the Design Space led to the two new concrete layouts. Prove It Works led to comparisons of actual copy, card geometry, connector progression, and before/after recordings.

## Before and after

| View | Previous PR version | Revised |
| --- | --- | --- |
| 390px example | [Paragraphs](before/example-390-choice-3.png) | [Message and reply](after/example-390-choice-3.png) |
| 320px example | [Paragraphs](before/example-320-choice-1.png) | [Message and reply](after/example-320-choice-1.png) |
| Desktop | [Paragraphs](before/example-1440-choice-1.png) | [Information to reply](after/example-1440-choice-1.png) |

[Phone video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [reduced-motion video](videos/reduced-motion-diff.mp4), and [no-JavaScript video](videos/no-javascript-diff.mp4) select matching cases in both versions. The phone recording uses labelled 390×1100 viewports to show the comparison together. Compact phone layouts are captured separately. [Keyboard focus](after/keyboard-focus-390.png) and [simulated static fallback](after/selection-enhancement-removed-390.png) are also captured.

## Copy for owner review

All three new messages, information snippets, replies, control labels, notes, and the short heading/caveat/link label require editorial review. The complete current copy is in `src/content/workflow-example.ts`.

The Saturday hours, order #1042, and collection requests are fictional teaching details. They do not describe Alvin's business hours, clients, services, or results. The widget explicitly says "Fictional shop example. No live AI." The special-request draft asks to check arrangements; it promises no accommodation or outcome. A person still checks before sending.

These are now fictional sample messages rather than verbatim article excerpts. The obsolete excerpt-provenance unit test was removed. Browser checks verify that every case renders its declared question, information, reply, and note. The article itself is unchanged.

## Verification and limits

All 15 targeted browser checks passed with no retries. Seven cover this component, including keyboard/touch, no requests during selection, internal and external geometry, finite connector progress, static reduced motion, no JavaScript, simulated unsupported-feature fallback, and unstyled content. The eight existing hero workflow checks also pass. Typecheck, lint, formatting, 44 unit tests, and the labelled 12-page prelaunch build pass.

[Layout evidence](layout-evidence.json) records original-row equality and per-case text/height measurements. [Verification](verification.json) records browser results, hero-section pixel identity at 320/390/768/1440px, and script hashes. Home inline scripts and all external JavaScript files match the previous version. Bundle sizes are observations, not performance results.

Selection enhancement requires both `:has()` and subgrid. Without those CSS features, controls hide and all cases remain readable. The fallback screenshot/test removes only the component's support-gated CSS rules, which simulates that condition in Chromium. It does not establish an actual older browser's behavior. Native browser zoom, other engines, real devices, and screen-reader operation remain unverified.

## Throughput checkpoint

- Blocking first steps. Inspect the rejected version and the specific feedback, then render two shorter alternatives before production edits.
- Independent workstreams. A prototype owner owns standalone designs, an implementation owner owns component/content/tests, and parent owns recordings/docs/PR. An independent reviewer reads source without mutation.
- Shared mutable state. Browser tests, candidate builds, and captures serialize against generated output. The previous version uses a separate immutable source snapshot and server.
- Smallest safe decomposition. Reuse the existing native selection and scoped component. Add a finite decorative connector, not a runtime controller or a new feature.

Reproduce with prelaunch builds of `943753c` and the revised commit, served on ports 4346 and 4340. Run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-workflow-example-revision.mjs`.

PR #31 remains unmerged with auto-merge disabled until the owner reviews this revision. PRs #28/#30 and Services investigation #29 remain separate. Branding, biography, hero workflow, service links, original example copy, and disabled prelaunch inquiries remain intact.
