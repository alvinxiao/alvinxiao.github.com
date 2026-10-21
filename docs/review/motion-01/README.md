# Section reveal review

This is the first implementation from [MOTION-01, issue #2](https://github.com/alvinxiao/alvinxiao.github.com/issues/2). It remains unmerged until the owner reviews and approves this PR.

## What to review

Open the [comparison gallery](index.html) locally for side-by-side pages and recordings. GitHub can display the linked PNGs directly; the MP4 links open or download the recordings.

| View              | Before                                             | After                                                 |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Desktop motion    | [Original](videos/before-1280.mp4)                 | [Section reveals](videos/after-1280.mp4)              |
| Mobile motion     | [Original](videos/before-390.mp4)                  | [Section reveals](videos/after-390.mp4)               |
| Reduced motion    | Existing static lower sections                     | [Static after version](videos/after-1280-reduced.mp4) |
| Reveal frame      | [Original visitor paths](before/paths-in-view.png) | [Reveal paused at 120ms](after/paths-in-view.png)     |
| Home desktop      | [Before](before/home-1440.png)                     | [After](after/home-1440.png)                          |
| Home mobile       | [Before](before/home-390.png)                      | [After](after/home-390.png)                           |
| Services desktop  | [Before](before/services-1440.png)                 | [After](after/services-1440.png)                      |
| About desktop     | [Before](before/about-1440.png)                    | [After](after/about-1440.png)                         |
| Resources desktop | [Before](before/resources-1440.png)                | [After](after/resources-1440.png)                     |

The full-page screenshots show the settled layout. The recordings show when motion starts and how it settles. No copy or layout redesign is intended.

## Chosen treatment

Content groups move upward by 16px and settle over 650ms, with a short sibling stagger capped at 210ms. Each group plays once per page visit. Elements already visible at initial load skip the effect. Individual biography paragraphs do not animate independently.

The [upward-settle prototype](prototypes/lift.png) was selected over the [scale-in prototype](prototypes/scale.png), so text does not resize during entry. These prototypes informed a visual judgment; they are not measured usability results.

## Implementation and fallback

`data-reveal` opts in existing markup. `data-reveal-group` supplies sibling order. One shared browser helper owns pending targets, played targets, and active animations. It starts a Web Animation on intersection and removes the effect after completion. There is no default hidden CSS state.

Missing observer or animation APIs leave static content visible. Keyboard focus, fragment navigation, printing, and enabling reduced motion settle affected animations immediately. Native navigation, service disclosures, workflow playback, and the inactive prelaunch form retain their existing behavior.

## Verification

- All 64 browser scenarios passed locally, including seven new reveal scenarios and the existing inquiry, accessibility, responsive, workflow, and no-JavaScript checks.
- Typecheck, lint, formatting, and the actual prelaunch output guard passed.
- Independent source review found no material issues.
- The before build was produced from `70e6580`, whose runtime source matches the approved backlog PR's base. It is served separately from the implementation build for capture.
- [Bundle inventory](bundle-bytes.json) records external JavaScript assets, inline script bytes, and Home HTML sizes, including gzip inventories. This is an artifact-size comparison, not a speed benchmark or a measured network transfer claim. No animation dependency was added.

Testing exposed a direct-fragment initialization edge: the browser's `:target` was not yet populated when the module started. The helper now resolves the decoded fragment ID directly and handles malformed encoding at that input boundary. The regression case passes.

## Reproduce the media

Build the before revision in a separate temporary source copy and serve its `dist` directory at port 4330. Build this revision with `npm run build:prelaunch` and serve it with `npm run preview -- --ignore-lock --host 127.0.0.1 --port 4325`.

Install the Playwright browser and FFmpeg support or configure the supplied local binaries, then run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-reveal-review.mjs
```

`BEFORE_URL` and `AFTER_URL` override the capture origins. The host `ffmpeg` command must be available for MP4 conversion. The helper generates screenshots, recordings, and the local comparison gallery.

## Review gate

The owner explicitly requested before-and-after review of each implementation PR. Passing CI does not authorize this PR's merge or auto-merge. The live website continues to serve the previously approved implementation until this PR is approved and merged.
