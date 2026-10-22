# Contact intro motion fix

Issue #18. Owner approval is required before merge.

## Reproduction and decision

The owner reported choppy motion in “A conversation starts here / What are you working on?” Actual Chromium inspection found three separate 700ms text entrances, with delays of 0, 70, and 140ms. At effect time 200ms their opacities were approximately 0.82, 0.64, and 0.35, and their vertical offsets differed. See [runtime samples](baseline-diagnosis.json) and the [mid-animation frame](baseline-mid-animation.png).

These measurements confirm independently staggered, moving text. They do not establish dropped frames on the owner's device. Native navigation also retains the site's existing root fade.

| Treatment | Decision |
| --- | --- |
| One group fade with stationary text | Selected. Removes independent text motion and stagger while retaining a short entrance. |
| One group fade and translation | Rejected. Still moves glyphs through fractional positions. |
| Fully static introduction | Viable, but a small opacity entrance preserves the existing motion direction. |

Contact now owns one 500ms opacity-only entrance, from 0.65 to 1. Its children do not animate. Default content is fully visible; reduced motion is static. Copy, geometry, form handling, prelaunch submission safeguards, other page entrances, and the document fade stay unchanged. No JavaScript or dependency is added.

Fix Root Causes shaped the removal of independent moving text rather than merely increasing duration. Prove It Works requires checking actual effect ownership and text geometry in the built page. This is a perceptual motion correction, not a measured frame-rate improvement.

## Throughput checkpoint

- Blocking first steps. Inspect Contact and shared motion rules; reproduce staggered text effects before editing.
- Independent workstreams. One implementation owner edits Contact and browser regression checks. Parent owns diagnosis artifacts, baseline/candidate builds, comparison media, documentation, and PR publication. A fresh source reviewer checks the result.
- Shared mutable state. Baseline output uses a temporary snapshot. Candidate builds, tests, and recordings run sequentially against shared output.
- Smallest safe decomposition. Keep the fix local to Contact's scoped CSS. A new global motion helper or form feature is unnecessary.

## Review gate

Leave the PR unmerged, with auto-merge disabled, until the owner reviews the recordings and explicitly approves it. Form-state feedback issue #9 remains deferred; inquiry submission stays disabled.

## Before and after

Baseline is merged PR #17, commit `628558297a2023b28ea67b6c970bdb654bbcd79b`. Both sides are actual prelaunch builds.

- [Phone recording](videos/phone-diff.mp4)
- [Phone replay at half speed, labelled](videos/phone-slow.mp4)
- [Desktop recording](videos/desktop-diff.mp4)
- [Reduced-motion recording](videos/reduced-motion-diff.mp4)

The capture holds actual entrance effects until both frames and fonts are ready, then releases them together. Before has three moving text groups; After fades the whole introduction without moving it. No replacement animation is inserted. Preparation frames remain so the start is not trimmed away. The comparison demonstrates motion treatment, not frame-rate or loading-speed performance. Native full-page navigation is checked separately in the browser regression suite.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Contact](before/contact-320.png) | [Contact](after/contact-320.png) |
| 390px | [Contact](before/contact-390.png) | [Contact](after/contact-390.png) |
| 768px | [Contact](before/contact-768.png) | [Contact](after/contact-768.png) |
| 1440px | [Contact](before/contact-1440.png) | [Contact](after/contact-1440.png) |

Screenshots use reduced motion to show settled appearance. Capture assertions confirm identical introduction wording, no horizontal overflow, and disabled prelaunch submission at all widths.

## Verification and limits

Four targeted Chromium scenarios passed without retries. They check one parent effect and no child effects or delay; stable heading and paragraph geometry through start/middle/end at all four widths; initial/runtime reduced motion; no-JavaScript navigation and disabled submission; and native Services-to-Contact navigation while retaining Services' original entrance. Independent source review found no material issues. The 12-page prelaunch build passed its disabled-inquiry, labelling, and launch-checklist checks. See [final verification](verification.json).

The [equivalent-build inventory](bundle-inventory.json) shows unchanged external assets and shared inline JavaScript. Contact adds a 264-byte scoped inline stylesheet. Complete Contact HTML grows by 1,828 raw bytes and 185 gzip bytes, including Astro's scoped attributes. No dependency or runtime script is added. These byte counts do not establish animation frame rate.

Runtime evidence uses Chromium on Linux. Safari, Firefox, and the owner's device were not tested. The global document fade remains in place, so native navigation can still include that existing fade. The new local entrance uses only opacity. Inquiry activation, provider/privacy setup, and form-state feedback remain deferred.

## Reproduce

```sh
npm run typecheck
npm run lint
npm run format:check
npm run check:docs
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/contact-motion.spec.ts --workers=2
npm run build:prelaunch
```

Serve the baseline prelaunch on port 4338 and candidate prelaunch on port 4325, then run `node scripts/capture-contact-intro-review.mjs`. `BEFORE_URL`, `AFTER_URL`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override defaults. Playwright video recording and ffmpeg are required. The cloud recording uses `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media` for its ffmpeg executable. Candidate builds, tests, and captures run sequentially because they share `dist/`.
