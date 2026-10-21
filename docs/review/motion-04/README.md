# Service destination feedback review

MOTION-04, issue #5. Owner approval is required before merge.

## Design

Native fragment navigation owns selection through `:target`. The selected service heading receives a short underline sweep, followed by a persistent underline. Reduced motion shows the same selected state immediately. The underline is decorative and stays outside text flow.

| Treatment | Decision |
| --- | --- |
| Animate the whole selected service panel | Avoid competing with group entrances and moving several text columns. |
| Add a local heading underline | Chosen. Confirm the destination without changing layout, scrolling, focus, or history. |
| Intercept navigation with JavaScript | Native fragments already cover direct links, history, keyboard activation, and no-JavaScript use. |

Repeated clicks on the current fragment retain its selected underline. They do not need to restart the finite animation. The browser retains its usual scrolling behavior.

## Throughput checkpoint

- Blocking first steps. Confirm and merge approved PR #13 before branching. Inspect native service links, existing reveal ownership, and issue criteria.
- Independent workstreams. One delegate owns CSS and browser tests. Parent owns a separate baseline build, review media, and PR publication.
- Shared mutable state. Source edits stay separate from review tools and documentation. Candidate builds and captures run sequentially.
- Smallest safe decomposition. One implementation owner keeps native target state and motion preferences coherent. Parent reviews source and actual recordings independently.

## Review gate

This PR remains unmerged with auto-merge disabled until the owner reviews the video and explicitly approves it.

## Behavior and scope

Only the selected service heading gains the underline. Normal motion grows it from 25% to full width over 900ms. Selection remains visible after the animation ends. The animation starts when the fragment changes; native scrolling proceeds at the browser's pace. Reduced motion shows the full underline immediately and cancels an active sweep when preferences change.

There is no navigation interception, forced focus, scroll snapping, custom history, or new JavaScript. The existing service inquiry selection, open disclosures, disabled public prelaunch inquiries, and thin workflow outline retain their behavior.

## Visual review

Before is left, After is right. Both views share one recording. Native service links are activated together to compare their destinations without pointer travel. Real mouse, keyboard, touch, Back, and no-JavaScript behavior are exercised by the browser tests.

- [Desktop video diff](videos/desktop-diff.mp4).
- [Half-speed replay](videos/desktop-slow.mp4).
- [Mobile video diff](videos/mobile-diff.mp4).
- [Reduced-motion video diff](videos/reduced-motion-diff.mp4).

| Width | Before | After |
| --- | --- | --- |
| 320px | [Before](before/selected-320.png) | [After](after/selected-320.png) |
| 390px | [Before](before/selected-390.png) | [After](after/selected-390.png) |
| 768px | [Before](before/selected-768.png) | [After](after/selected-768.png) |
| 1440px | [Before](before/selected-1440.png) | [After](after/selected-1440.png) |

## Verification

- Six new browser scenarios passed locally on the first run. They cover direct fragments, native mouse and keyboard links, Back, repeated same-target activation, rendered underline growth with stable heading dimensions, initial/runtime reduced motion, touch/no JavaScript, open disclosures, and editable inquiry interest in the preview fixture.
- Typecheck, ESLint, formatting, all 44 unit tests, and the actual 12-page prelaunch output guard passed. [Verification details](verification.json) contain the browser results and video metadata.
- [Bundle inventory](bundle-bytes.json) records 491 added CSS bytes, or 104 bytes gzipped, with unchanged external JavaScript hashes. These are file-size measurements, not a speed benchmark.
- Parent inspected actual desktop and mobile comparison frames.
- Independent source review found no material issues.
- Runtime and visual evidence uses Chromium. Other engines were not visually checked in this pass.

Prove It Works shaped the verification. The tests sample the rendered underline, verify native navigation and selection, and check its static endpoint after reduced motion changes.

## Reproduce

Build baseline commit `d6bea5c8cf3832a067a5a30bc0b3bfc9401e7268` in a separate temporary source copy and serve its prelaunch output at 4334. Build this branch with `npm run build:prelaunch` and serve it at 4325.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-anchor-review.mjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/anchor-feedback.spec.ts
```

The capture helper requires Playwright video support and host `ffmpeg`/`ffprobe`. `BEFORE_URL` and `AFTER_URL` override the origins.
