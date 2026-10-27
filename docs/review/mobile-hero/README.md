# Mobile homepage hero review

Issue #21. Owner approval is required before merge.

## Design decision

The compact opening needs an early useful action without shrinking the approved typography or hiding the workflow. Two rendered alternatives keep the same copy and reading order:

- Inset editorial stack: compact copy/actions followed by an inset workflow frame.
- Full-width workflow band: the same compact opening, followed by wider step cards on their own ground.

The band is selected. It reduces nested framing and gives the steps more room on phones. The primary Contact action fits in the 360×640 opening. At 320×640 it still needs a small scroll; this is preferable to squeezing text or imposing an above-the-fold quota. Desktop remains independently composed.

| Prototype | Width | Opening | Workflow | Exit |
| --- | --- | --- | --- | --- |
| Inset | 320 | [View](prototypes/inset-320-opening.png) | [View](prototypes/inset-320-middle.png) | [View](prototypes/inset-320-exit.png) |
| Band | 320 | [View](prototypes/band-320-opening.png) | [View](prototypes/band-320-middle.png) | [View](prototypes/band-320-exit.png) |
| Inset | 360 | [View](prototypes/inset-360-opening.png) | [View](prototypes/inset-360-middle.png) | [View](prototypes/inset-360-exit.png) |
| Band | 360 | [View](prototypes/band-360-opening.png) | [View](prototypes/band-360-middle.png) | [View](prototypes/band-360-exit.png) |
| Inset | 390 | [View](prototypes/inset-390-opening.png) | [View](prototypes/inset-390-middle.png) | [View](prototypes/inset-390-exit.png) |
| Band | 390 | [View](prototypes/band-390-opening.png) | [View](prototypes/band-390-middle.png) | [View](prototypes/band-390-exit.png) |
| Inset | 768 | [View](prototypes/inset-768-opening.png) | [View](prototypes/inset-768-middle.png) | [View](prototypes/inset-768-exit.png) |
| Band | 768 | [View](prototypes/band-768-opening.png) | [View](prototypes/band-768-middle.png) | [View](prototypes/band-768-exit.png) |
| Inset | 1440 | [View](prototypes/inset-1440-opening.png) | [View](prototypes/inset-1440-middle.png) | [View](prototypes/inset-1440-exit.png) |
| Band | 1440 | [View](prototypes/band-1440-opening.png) | [View](prototypes/band-1440-middle.png) | [View](prototypes/band-1440-exit.png) |

Production refines the selected prototype by removing an existing duplicated workflow top margin and allowing enlarged heading text to wrap. The existing 18px lead copy, 15px caption floor, 16px workflow gaps, thin stage outlines, timings, and manual/offscreen pause behavior are retained. Text, controls, and their reading order stay intact. No JavaScript or dependency is added.

Scrollcraft's separate mobile composition guidance shaped the full-width band. Experience First shaped the decision to keep readable text rather than force every element into one screen. Prove It Works requires inspecting opening, intermediate, exit, keyboard, fallback, and enlarged-text states in the actual build.

## Throughput checkpoint

- Blocking first steps. Merge approved PR #27 and verify deployment. Inspect responsive rules and render both alternatives at five widths before selecting one.
- Independent workstreams. One implementation owner edits Home-scoped mobile CSS and browser checks. Parent owns prototypes, baseline/candidate builds, recordings, evidence, and PR publication. A separate reviewer checks final source.
- Shared mutable state. Baseline output uses a temporary snapshot. Candidate builds, tests, and media capture run sequentially because they share output.
- Smallest safe decomposition. Preserve the existing markup and animation controllers. Mobile CSS owns composition; existing workflow CSS/JavaScript retain playback ownership.

## Review gate

Keep the PR unmerged with auto-merge disabled until the owner reviews the before/after evidence and approves. The service comparison in #22 is a separate future PR. Prelaunch inquiries remain disabled.

## Before and after

Baseline: merged PR #27, `e9cf78be16adc0cf5b7116118ff580f720f78696`. Both snapshots use the same prelaunch build configuration.

| View | Before | After |
| --- | --- | --- |
| 360px opening | [Before](before/hero-360-opening.png) | [After](after/hero-360-opening.png) |
| 320px workflow | [Before](before/hero-320-middle.png) | [After](after/hero-320-middle.png) |
| 768px workflow | [Before](before/hero-768-middle.png) | [After](after/hero-768-middle.png) |
| Desktop | [Before](before/hero-1440-opening.png) | [After](after/hero-1440-opening.png) |

Recordings: [Phone before/after](videos/phone-diff.mp4), [tablet before/after](videos/tablet-diff.mp4), and [reduced motion](videos/reduced-motion-diff.mp4). These show actual builds at matching viewport sizes, natural scrolling, and the retained pause control. They are visual comparisons, not performance measurements.

At 360×640 the Contact button ends at 631px instead of 673px. The full hero text matches before/after at all five widths. All three 1440px opening/workflow/exit screenshots are byte-identical. See [layout measurements](layout-evidence.json).

The production CSS grows from 33,028 to 33,497 bytes, or 7,713 to 7,825 gzip bytes. All three external JavaScript files have unchanged SHA-256 hashes. No runtime or dependency was added. These byte counts do not establish a performance improvement.

## Validation and limits

- Typecheck: 61 files, zero errors, warnings, or hints.
- ESLint and Prettier pass. All 44 unit tests pass.
- Five new browser checks cover the compact action, five-width content/reflow, root text enlargement, keyboard/touch links, and no-JavaScript/missing-observer fallback. Existing workflow checks cover playback and pause behavior.
- [Root 200% opening](after/text-200-390-opening.png), [root 200% workflow](after/text-200-390-workflow.png), and [720px reflow](after/reflow-720.png) were inspected. Changing the root font size exercises rem-based text; it does not enlarge fixed-pixel text or reproduce native browser zoom.
- Chromium on Linux only. Real-device, Safari, Firefox, native browser zoom, and screen-reader behavior are not established by these checks.
- Earlier targeted verification encountered a preview startup timeout before any assertions ran. The unchanged rerun passed all 13 targeted checks. Final full-suite results are recorded below.

Reproduce with `npm run build:prelaunch`, then serve a baseline build on port 4342 and the candidate build on port 4340. Run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-mobile-hero-review.mjs`. Chromium and Playwright's ffmpeg binary are required. Full checks: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run test:e2e`, and `npm run check:docs`.
