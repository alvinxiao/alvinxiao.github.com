# Resource-card interaction review

MOTION-02, issue #3. This PR requires owner approval before merge.

## Plan and ownership

Resource cards are ordinary article links. Their artwork component is also used inside articles, so interaction styles must be scoped to `.resource-card`. The reveal helper owns the card's entrance transform. CSS will own image zoom, frame emphasis, and arrow feedback for idle, fine-pointer hover, keyboard focus, and reduced-motion states.

| Approach | Decision |
| --- | --- |
| Transform the whole card | Avoid competing with the existing entrance animation and moving text. |
| Transform only artwork inside its existing frame | Chosen. Preserve layout and readable text while coordinating frame and arrow emphasis. |
| Add pointer event handlers | CSS already represents these states and works without JavaScript. |

## Throughput checkpoint

- Blocking first steps. Confirm approved PR #11 is green and merge it before branching. Inspect card markup, shared artwork consumers, existing transitions, and issue acceptance criteria.
- Independent workstreams. One implementation delegate owns CSS and behavioral tests. The parent owns baseline capture, review media, and PR publication.
- Shared mutable state. Source writes stay in disjoint files. Separate baseline output from the candidate build. Serialize candidate builds and browser captures.
- Smallest safe decomposition. One implementation owner keeps hover, focus, touch, and reduced-motion states coherent. The parent independently reviews the diff and actual browser output.

## Review gate

The approved section-reveal PR is separate. This resource-card PR stays unmerged until the owner reviews its before-and-after video and explicitly approves it.

## Before and after

- [Desktop video diff](videos/desktop-diff.mp4). Pointer entry, pointer exit, and keyboard focus. Before is left, After is right.
- [Reduced-motion video diff](videos/reduced-motion-diff.mp4). Static emphasis with no zoom or arrow travel.
- [Touch video diff](videos/touch-diff.mp4). Touch scrolling without hover enlargement. Article navigation is covered separately by the browser checks.

The recordings use separate browser pages so both versions receive real hover and keyboard focus. They run through a shared interaction schedule. Preparation is trimmed from each recording using the common interaction duration. This is a visual comparison, not a frame-accurate latency benchmark.

| Screenshot | Before | After |
| --- | --- | --- |
| Pointer feedback | [Before](before/hover.png) | [After](after/hover.png) |
| Keyboard feedback | [Before](before/focus.png) | [After](after/focus.png) |
| 320px | [Before](before/resources-320.png) | [After](after/resources-320.png) |
| 390px | [Before](before/resources-390.png) | [After](after/resources-390.png) |
| 768px | [Before](before/resources-768.png) | [After](after/resources-768.png) |
| 1440px | [Before](before/resources-1440.png) | [After](after/resources-1440.png) |

## Behavior and scope

Artwork zooms to 1.025 over 420ms and stays clipped inside the existing frame. Hovering anywhere on a resource card coordinates the artwork, frame, and existing arrow. Keyboard focus receives the same emphasis and keeps the existing 3px focus outline. Fine-pointer hover gating prevents a sticky enlargement on touch. Reduced motion removes zoom and arrow movement while retaining static emphasis, including when the preference changes during a visit.

All behavior is local CSS. Article artwork, entrance transforms, copy, layout, open service disclosures, and prelaunch inquiry controls retain their existing behavior.

## Verification and limits

- All five new browser scenarios passed locally without retries. They check stable artwork and heading bounds, clipping, hover reset, real keyboard reachability and Enter navigation, article-artwork isolation, runtime reduced motion, touch navigation, and navigation without JavaScript.
- Typecheck, ESLint, formatting, and all 44 unit tests passed. [Verification details](verification.json) include the targeted browser results and video metadata.
- An independent source reviewer found no material issues. The parent also inspected frames from the actual comparison video.
- The prelaunch output guard passed for all 12 HTML pages with inactive inquiries.
- [Bundle inventory](bundle-bytes.json) compares equivalent prelaunch builds. CSS grew by 878 bytes, or 128 bytes gzipped. All three external JavaScript assets have identical hashes. File size is not a measured loading-speed improvement.
- Local runtime evidence uses Chromium. Other browser engines have not been visually verified in this pass.

Prove It Works shaped the verification. The browser checks exercise article navigation and actual computed interaction states, and the review includes recordings from built pages rather than mockups.

## Reproduce

Build baseline commit `8332413696eed532359d9d33b6959aaa83fc2e99` in a separate temporary source copy and serve its prelaunch output at port 4332. Build this branch with `npm run build:prelaunch` and serve it at port 4325.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-resource-motion-review.mjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/resource-motion.spec.ts
```

The capture helper requires Playwright video support and host `ffmpeg`/`ffprobe` binaries. `BEFORE_URL` and `AFTER_URL` override the origins. The helper records four responsive widths and normal, reduced-motion, and touch comparisons.
