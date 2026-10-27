# Homepage examples label review

Issue #20. Owner approval is required before merge.

## Problem and correction

The examples section points `aria-labelledby` at `examples-heading`, but the visible heading had no matching ID. Adding the ID to that existing H2 lets the browser expose the section as a named region. No wording, styling, focus control, or animation changes are intended.

The browser checks now resolve every `aria-labelledby` token against rendered IDs across all 12 pages, including the 404 page. Missing, empty, and ambiguous references fail. A Home regression also checks the region's name against its visible heading.

## Throughput checkpoint

- Blocking first steps. Confirm issue #20, preserve the latest owner biography/descriptor, and save the current prelaunch baseline. Run the new check against the broken page before changing the heading.
- Independent workstreams. One implementation owner handles the heading ID and browser checks. Parent owns baseline/candidate captures, accessibility evidence, review documentation, and PR publication. A separate reviewer checks the final source.
- Shared mutable state. Baseline output is copied into a temporary snapshot. Candidate builds, tests, and recording run sequentially against shared output.
- Smallest safe decomposition. One markup attribute fixes the accessible-name contract. Extend the existing route checks rather than add another HTML parser or dependency.

## Review gate

The PR stays unmerged with auto-merge disabled until the owner approves it. The mobile hero in #21 remains a separate next PR. Public inquiries stay disabled.

## Before and after

Baseline is owner commit `208e63a1ba6ef92dec23f49c4375e40c1c5ea561`. Both sides use actual prelaunch output.

- [Comparison recording](videos/label-comparison.mp4)
- [Browser accessibility evidence](accessibility-evidence.json)
- [Compiled output and screenshot comparison](output-comparison.json)

The recording overlays role/name values read from Chromium's accessibility tree. Before is `generic` with no name. After is `region`, named “Less repetitive work. More time for your business.” No replacement screen-reader output or animation is simulated. Reduced motion is used because this is a label fix, not a new motion treatment.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Examples](before/examples-320.png) | [Examples](after/examples-320.png) |
| 390px | [Examples](before/examples-390.png) | [Examples](after/examples-390.png) |
| 768px | [Examples](before/examples-768.png) | [Examples](after/examples-768.png) |
| 1440px | [Examples](before/examples-1440.png) | [Examples](after/examples-1440.png) |

Each screenshot pair is byte-identical. Captures confirm identical section text, no horizontal overflow, and identical DOM focus candidates/order. A real keyboard Tab from the last service preview reaches “A little about me” before and after at every width; the new ID introduces no tab stop. This checks that boundary, not a complete screen-reader or keyboard audit.

## Verification and limits

Before changing the H2, the named-region regression failed with expected count 1, received 0. The reference check separately reported `section`, reference `examples-heading`, matches 0. After the fix, all 13 targeted route/region checks passed without retries across the 12 pages. Independent source review found no material issues. The 12-page prelaunch build passed its labelling and disabled-inquiry checks. See [final verification](verification.json).

The compiled-output comparison found only `index.html` changed. Removing the new `id="examples-heading"` attribute makes that file identical to the baseline. Every other generated file is byte-identical, including JavaScript and stylesheets. No dependency is added.

Runtime evidence uses Chromium on Linux. Safari, Firefox, VoiceOver, NVDA, and real mobile devices were not tested. A named region and automated checks do not establish complete accessibility compliance. No user biography, descriptor, service scope, form activation, or commercial-launch decision changed.

## Reproduce

```sh
npm run typecheck
npm run lint
npm run format:check
npm run check:docs
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/site.spec.ts --grep 'accessible, labelled|homepage examples|missing routes' --workers=2
npm run build:prelaunch
```

Serve the baseline prelaunch on port 4341 and candidate on port 4340, then run `node scripts/capture-examples-label-review.mjs`. The script uses the Chromium accessibility protocol to read actual roles and names. `BEFORE_URL`, `AFTER_URL`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override defaults. Playwright video recording and ffmpeg are required. The cloud recording uses `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media`. Candidate builds, tests, and recordings run sequentially because they share `dist/`.
