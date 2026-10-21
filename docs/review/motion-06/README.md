# About motion accent review

MOTION-06, issue #7. This PR requires owner approval before merge.

## Design decision

The accent is a decorative 96px teal-and-peach line beneath the existing heading. A finite 650ms draw starts after 200ms. The biography remains still and its wording stays unchanged.

| Prototype | Phone | Desktop | Decision |
| --- | --- | --- | --- |
| Heading line | [390px](prototypes/line-390.png) | [1440px](prototypes/line-1440.png) | Selected. Fits the existing heading space without moving the page. |
| Abstract illustration | [390px](prototypes/illustration-390.png) | [1440px](prototypes/illustration-1440.png) | Rejected. Crowds the mobile eyebrow and adds an unnecessary visual symbol. |

Comparison frames were captured before production implementation. Experience First shaped the choice of a small heading accent over extra artwork. Exhaust the Design Space shaped the two rendered alternatives. Prove It Works requires checking actual animation, text, and geometry in the built page.

## Ownership and alternatives

About owns one decorative element and one finite animation. Its default style is fully drawn. JavaScript adds motion only when the animation API is available and reduced motion is off. A runtime reduction cancels the animation and leaves the full static line. Returning to normal motion does not restart it.

A CSS animation inside a motion media query would restart when that preference re-enters. A small page-local animation avoids that replay without adding a shared state machine or observer. No-JavaScript and missing-API paths retain the static accent. About's existing biography `data-reveal` attribute is removed so short viewports cannot trigger movement in the paragraphs.

## Throughput checkpoint

- Blocking first steps. Merge approved PR #15 and verify deployment. Inspect About, shared hero motion, and reveal ownership. Render two alternatives before selecting the line.
- Independent workstreams. One implementation owner edits About and its browser tests. Parent owns baseline builds, comparison captures, documentation, and PR publication. A separate reviewer checks the final source.
- Shared mutable state. Baseline builds use a temporary source snapshot. Candidate builds, browser tests, and video capture run sequentially against shared output.
- Smallest safe decomposition. One owner keeps static fallback, motion preference, and one-shot animation behavior together in About. No shared animation helper is added.

## Review gate

The PR remains unmerged, with auto-merge disabled, until the owner reviews the recordings and approves it. Full commercial-launch gates stay separate.

## Before and after

Baseline is merged PR #15, commit `990ed0126adc5407104320e07501135567f43287`. Both sides are actual prelaunch builds.

- [Phone video](videos/phone-diff.mp4)
- [Phone replay at half speed, labelled](videos/phone-slow.mp4)
- [Desktop video](videos/desktop-diff.mp4)
- [Reduced-motion video](videos/reduced-motion-diff.mp4)

Both builds appear in one recording. The capture holds their actual heading effects and the candidate's actual line effect until fonts load, then releases them together at normal speed. No replacement animation is inserted. Preparation frames remain so the start of the draw is visible. The half-speed replay is labelled. These recordings compare appearance, not page-load or navigation speed.

| Width | Before | After |
| --- | --- | --- |
| 320px | [About](before/about-320.png) | [About](after/about-320.png) |
| 390px | [About](before/about-390.png) | [About](after/about-390.png) |
| 768px | [About](before/about-768.png) | [About](after/about-768.png) |
| 1440px | [About](before/about-1440.png) | [About](after/about-1440.png) |

Screenshots show settled reduced-motion states. Capture assertions compare the complete biography text between builds and confirm no horizontal overflow at each width. Browser tests separately isolate the accent from the pre-existing hero entrance and compare heading/prose geometry during its draw.

## Acceptance and verification

| Requirement | Evidence |
| --- | --- |
| One finite decorative accent | Browser test samples the actual effect at its start, middle, and end; scroll return never starts a second effect. |
| Stationary approved biography | Exact paragraphs match `approval.json`; no reveal attribute, transform, opacity change, or paragraph animation. Capture also compares baseline text. |
| Reduced motion and runtime changes | Static initially; cancellation settles fully drawn; returning to normal never replays. |
| No layout shift or overflow | Stable heading/prose bounding boxes and 96×4px accent at all four widths. |
| No JavaScript or animation API | Static line, readable biography, and usable touch navigation. Missing API is simulated. |
| Review before publication | Source review, browser evidence, screenshots, recordings, and an unmerged PR. |

Four targeted Chromium scenarios passed without retries. The 12-page prelaunch build passed its labelling, disabled-inquiry, and launch-checklist checks. Independent source review found no material issues. Final local results are in [verification data](verification.json).

The [bundle inventory](bundle-inventory.json) compares equivalent prelaunch output. About adds a 410-byte inline script and 274-byte scoped inline stylesheet. Its complete HTML increases by 1,065 raw bytes and 277 gzip bytes. External asset hashes and the shared inline script are unchanged. No dependency is added. Byte counts are not runtime performance measurements.

Runtime evidence uses Chromium on Linux. Safari and Firefox were not run. No claim of complete accessibility compliance or full commercial-launch readiness follows from these checks. The original hero entrance is preserved; the new line itself does not move text. Public inquiries remain disabled.

## Reproduce

```sh
npm run typecheck
npm run lint
npm run format:check
npm run check:docs
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/about-motion.spec.ts --workers=2
npm run build:prelaunch
```

Serve the baseline prelaunch on port 4336 and candidate prelaunch on port 4325, then run `node scripts/capture-about-review.mjs`. `BEFORE_URL`, `AFTER_URL`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override defaults. Playwright video recording and ffmpeg are required. The cloud recording uses `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media` for its ffmpeg executable. Candidate builds, tests, and captures must run sequentially because they share `dist/`.
