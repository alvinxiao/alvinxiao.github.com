# Service disclosure motion review

MOTION-03, issue #4. Owner approval is required before merge.

## Plan and ownership

Native `details[open]` owns disclosure state. CSS owns decorative indicator orientation and supported intrinsic expansion/collapse transitions. Summaries keep their native mouse, Space, and Enter behavior. All eight disclosures start open.

| Approach | Decision |
| --- | --- |
| Intercept clicks and measure fixed pixel heights with JavaScript | Avoid replacing native behavior or introducing focus and rapid-toggle coordination. |
| Animate native intrinsic details content with capability-gated CSS | Chosen. Keep native semantics and instant fallback without a new script. |

## Throughput checkpoint

- Blocking first steps. Verify and merge approved PR #12 before branching. Inspect disclosure markup, focus styling, native defaults, and browser support.
- Independent workstreams. One delegate owns CSS, any necessary disclosure markup, and behavioral tests. Parent owns baseline capture, review media, and PR publication.
- Shared mutable state. Keep source edits disjoint from review tooling and documentation. Build the baseline in a temporary source snapshot. Serialize candidate tests and media builds.
- Smallest safe decomposition. One implementation owner keeps native state, supported transitions, rapid toggles, and reduced-motion fallback coherent. Parent independently reviews source and actual built output.

## Review gate

This PR stays unmerged with auto-merge disabled until the owner reviews the video comparison and explicitly approves it.

## Behavior and scope

The disclosure chevron rotates between open and closed positions. Supporting browsers expand and collapse content over 300ms using its natural size. Native HTML owns state and focus, so clicks, Enter, Space, and rapid reversals retain their usual behavior. Content has no fixed maximum height.

The capability gate requires `::details-content`, intrinsic-size interpolation, and discrete transitions. Browsers without those features retain instant native disclosure behavior. Reduced motion also toggles instantly, including when the preference changes during an active transition.

Explicit open and closed endpoints remain outside the motion-preference gate. The content pseudo-element also has a base `transition: none`, so leaving normal motion cancels a transition already in progress. Merely removing the transition duration did not cancel that transition in Chromium. The regression test prolongs only its test transition to switch preferences reliably while content is collapsing. Separate progress checks use the production timing.

All eight disclosures still start open. Service copy, navigation, artwork, inquiry controls, and the existing thin workflow outline retain their behavior. No JavaScript or animation dependency is added.

## Visual review

Before is on the left, After on the right.

- [Desktop comparison](videos/desktop-diff.mp4).
- [Desktop half-speed replay](videos/desktop-slow.mp4).
- [Mobile comparison](videos/mobile-diff.mp4).
- [Reduced-motion comparison](videos/reduced-motion-diff.mp4).

Both views share one browser recording. Native summary toggles are issued together to compare the visual transitions without pointer travel. Real mouse, keyboard, and touch inputs are exercised separately by the browser tests. The slower replay changes only video playback.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Before](before/services-320.png) | [After](after/services-320.png) |
| 390px | [Before](before/services-390.png) | [After](after/services-390.png) |
| 768px | [Before](before/services-768.png) | [After](after/services-768.png) |
| 1440px | [Before](before/services-1440.png) | [After](after/services-1440.png) |

## Limits

Runtime evidence uses Chromium. Actual older-engine fallback is source-reviewed, not runtime-proven. Chromium ignored the attempted feature-disable flag, so that attempt is not counted as unsupported-browser coverage. The initial reduced-motion case does exercise the instant-motion path directly. Other browser engines were not visually checked in this pass.

## Reproduce

Build baseline commit `a7eb2dff8845c37918b1d8ccc47862a1661f48f2` in a separate temporary source copy and serve its prelaunch output at port 4333. Build this branch with `npm run build:prelaunch` and serve it at port 4325.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-disclosure-review.mjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/disclosure-motion.spec.ts
```

The capture helper requires Playwright video support and host `ffmpeg`/`ffprobe`. `BEFORE_URL` and `AFTER_URL` override the origins.

## Verification

- All six new browser scenarios passed on the final run. They exercise native input/focus, rendered expansion/collapse at production timing, rapid reversals, initial and runtime reduced motion, enlarged text at 320px, touch, and no JavaScript.
- Fresh independent review of the final CSS and tests found no material issues. Parent inspected actual desktop and mobile comparison frames.
- ESLint, formatting, and all 44 unit tests passed.
- Typecheck passed with no errors, warnings, or hints. The actual prelaunch output guard passed all 12 HTML pages with inactive inquiries.
- [Bundle inventory](bundle-bytes.json) records 993 added CSS bytes, or 218 bytes gzipped. External JavaScript hashes are identical. These are file-size measurements, not a speed benchmark.
- [Verification details](verification.json) contain the browser report summary and video metadata.

Prove It Works shaped the checks. Tests measure rendered height rather than assuming that the pseudo-element transition appears in the animation API, and the active-collapse regression verifies real cancellation when the motion preference changes.
