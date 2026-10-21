# Workflow visibility review

MOTION-07, issue #8. Owner approval is required before merge.

## Design and ownership

Four independent inputs determine playback: viewport visibility, document visibility, reduced motion, and the visitor's checkbox choice. JavaScript derives one pause attribute. CSS owns playback for the existing cards, progress lines, icons, and arrows. Visibility changes never change the checkbox.

| Approach | Decision |
| --- | --- |
| Enumerate effects and call JavaScript pause/play | Rejected. Would duplicate CSS ownership and need to track effects recreated by motion changes. |
| Derive a pause attribute and keep CSS authoritative | Selected. Retains the existing checkbox fallback and preserves animation phase across viewport/document pauses. |

The observer must initialize successfully before enhanced state is applied. Missing or throwing observer support retains today's CSS-only animation and manual pause. Reduced motion continues to remove animation through existing CSS. Returning to normal motion may create a new sequence, while the user's pause choice remains intact.

Experience First shaped the choice to retain the existing user control and visual sequence. Prove It Works requires observing actual stopped and resumed animation time. This does not establish a CPU, battery, or performance improvement.

## Throughput checkpoint

- Blocking first steps. Merge approved PR #16, verify deployment, inspect workflow CSS and checkbox behavior, and compare ownership choices.
- Independent workstreams. One implementation owner handles the input model, component import, CSS selector, and browser tests. Parent owns baseline/candidate builds, comparison media, documentation, and PR publication. A fresh reviewer checks the source.
- Shared mutable state. Baseline output uses a temporary source snapshot. Candidate tests, builds, and capture run sequentially against shared `dist/`.
- Smallest safe decomposition. One owner keeps the input model and CSS fallback contract together. No animation framework, effect registry, or timer loop is added to the site.

## Review gate

Leave this PR unmerged with auto-merge disabled until the owner reviews the before-and-after recording and explicitly approves it. Commercial-launch gates remain separate; inquiries stay disabled.

## Before and after

Baseline is merged PR #16, commit `d42080c341c3cfb4e588a4d69e9a2a6cfd80a259`. Both sides use actual prelaunch builds.

- [Phone recording](videos/phone-diff.mp4)
- [Desktop recording](videos/desktop-diff.mp4)
- [Reduced-motion recording](videos/reduced-motion-diff.mp4)

The recording shows both builds in one camera. It aligns their actual effects to the same 1.0-second starting phase, then lets CSS control playback. The displayed clock reads the first card's actual CSS animation time, including its progress across loop boundaries. While offscreen, Before keeps advancing and After stops. Returning resumes After's prior phase. Both manual pause controls then remain paused across another offscreen return. Reduced-motion recording shows static workflows.

Capture assertions verify Before advances by over one second while offscreen, After stays within 100ms of its stopped time, and both manual pauses retain their times on return. Preparation frames remain in the recordings. These are behavior checks, not resource-use measurements. Document hiding is covered separately by a simulated visibility-state browser test.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Workflow](before/workflow-320.png) | [Workflow](after/workflow-320.png) |
| 390px | [Workflow](before/workflow-390.png) | [Workflow](after/workflow-390.png) |
| 768px | [Workflow](before/workflow-768.png) | [Workflow](after/workflow-768.png) |
| 1440px | [Workflow](before/workflow-1440.png) | [Workflow](after/workflow-1440.png) |

Screenshots use reduced motion to show settled appearance. Capture assertions compare workflow wording and confirm no horizontal overflow at each width. The CSS keyframes, timing, colors, and thin outline are unchanged.

## Acceptance and verification

| Requirement | Evidence |
| --- | --- |
| Offscreen pause and phase-preserving return | Real scrolling, frozen effect time, resumed time, repeated visibility changes, and before/after clock recording. |
| All workflow effects stop | Computed play state checks for cards, pseudo-element progress lines, icons, and arrows. |
| User pause stays independent | Keyboard selection persists across offscreen/document/motion changes; unchecking offscreen waits for visibility. |
| Document visibility and history refresh | Simulated `visibilityState`/event test and synthetic persisted `pageshow` refresh. A real browser background-tab switch was not tested. |
| Initial and runtime reduced motion | Existing static CSS and readable steps retained; checkbox choice survives returning to normal. |
| Observer or script failure | Missing observer, throwing constructor, throwing observe, and no-JavaScript keyboard/touch tests retain CSS/manual playback. |

All eight workflow scenarios passed without retries. The 12-page prelaunch build passed its labelling, disabled-inquiry, and launch-checklist checks. Independent source review found no material issues. Final checks are recorded in [verification data](verification.json).

The [equivalent-build inventory](bundle-inventory.json) records an additional Home-only inline script of 1,208 raw bytes and 553 gzip bytes. The shared inline script and external JavaScript hashes are unchanged. Shared CSS grows by 56 raw bytes and 13 gzip bytes. Complete Home HTML grows by 1,239 raw bytes and 309 gzip bytes. No dependency is added. No CPU, battery, frame-rate, or loading-speed improvement was measured.

Runtime evidence uses Chromium on Linux. Safari and Firefox were not run. Missing/broken observer support and document visibility are simulated where stated. Returning from reduced motion recreates the existing CSS sequence, rather than preserving the removed effects' phase. Partial viewport intersection counts as visible, including edge contact. No biography, service scope, provider configuration, inquiry activation, or full-launch approval changed.

## Reproduce

```sh
npm run typecheck
npm run lint
npm run format:check
npm run check:docs
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/workflow-motion.spec.ts --workers=2
npm run build:prelaunch
```

Serve the baseline prelaunch on port 4337 and candidate prelaunch on port 4325, then run `node scripts/capture-workflow-review.mjs`. `BEFORE_URL`, `AFTER_URL`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override defaults. Playwright video recording and ffmpeg are required. The cloud recording uses `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media` for its ffmpeg executable. Candidate builds, tests, and capture run sequentially because they share `dist/`.
