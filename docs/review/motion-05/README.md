# Mobile menu motion review

MOTION-05, issue #6. Owner approval is required before merge.

## Plan and state ownership

The menu has explicit desktop, closed, open, and closing states. Opening makes links available immediately. Closing updates expanded state and removes links from focus interaction immediately, while a short visual exit finishes. Escape returns focus to the toggle. Resizing and motion-preference changes settle the current state safely.

| Approach | Decision |
| --- | --- |
| CSS discrete display transitions alone | Would leave lifecycle, focus, and rapid reversals spread between CSS and event handlers. |
| Small typed menu controller with matched browser animations | Chosen for explicit interaction state, cancellation, and immediate focus protection. No navigation framework or dependency. |

The existing layout remains in flow. Active/current link underline feedback stays local. Without JavaScript, navigation remains visible and the menu toggle stays hidden.

## Throughput checkpoint

- Blocking first steps. Confirm green checks and merge approved PR #14. Inspect existing menu behavior, responsive CSS, and no-JavaScript tests.
- Independent workstreams. One delegate owns the menu controller, layout integration, CSS, and behavioral tests. Parent owns baseline capture, review media, and PR publication.
- Shared mutable state. Review files stay separate from source edits. Baseline output uses a temporary source snapshot. Candidate builds and captures run sequentially.
- Smallest safe decomposition. One implementation owner keeps animation cancellation and focus state coherent. Parent independently reviews the diff and built output.

## Review gate

This PR stays unmerged with auto-merge disabled until the owner reviews the videos and explicitly approves it.

## Before and after

Baseline: approved PR #14, commit `59edab522f1a3232b482907f4eab242ab9f3b185`. Both sides use prelaunch builds. The menu now fades and lifts over 220ms in either direction. A close immediately updates `aria-expanded` and makes links inert; rapid reopening cancels the previous effect. Native link navigation starts immediately. Desktop and reduced-motion changes cancel effects and restore the appropriate usable endpoint.

- [Phone video](videos/phone-diff.mp4)
- [Phone video at half speed, labelled](videos/phone-slow.mp4)
- [Tablet video](videos/tablet-diff.mp4)
- [Reduced-motion video](videos/reduced-motion-diff.mp4)

Each video records both builds in one browser page with labelled frames. The capture issues native clicks to both frames together. It demonstrates appearance, not a navigation-latency benchmark. Behavioral tests separately exercise pointer, keyboard, and touch interaction.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Header](before/navigation-320.png) | [Header](after/navigation-320.png) |
| 390px | [Header](before/navigation-390.png) | [Header](after/navigation-390.png) |
| 768px | [Header](before/navigation-768.png) | [Header](after/navigation-768.png) |
| 1440px | [Header](before/navigation-1440.png) | [Header](after/navigation-1440.png) |

Screenshots show settled states with reduced motion. Motion differences are visible in the recordings. Capture assertions confirmed visible navigation and no horizontal overflow at all four widths.

## Documentation organization

The owner requested this cleanup in the same PR. Seven project documents move to `docs/`: SPEC, CONTENT, DESIGN, ARCHITECTURE, TESTING, TASKS, and PRODUCTION_CHECKLIST. Root README and AGENTS stay discoverable. Resource article Markdown stays in Astro's `src/content/resources/` collection. Relative references are updated, and `npm run check:docs` now checks local documentation file links in both verification and prelaunch CI. The check does not validate heading anchors or external URLs.

## Verification and limits

Six targeted Chromium scenarios passed without retries: visible-but-inert closing and Tab exclusion; rapid reversal and native links; both breakpoint directions and focus transfer; initial/runtime reduced motion; missing animation/inert API fallbacks; and touch/no-JavaScript navigation with current-link emphasis. The breakpoint test exposed CSS clearing focus before the media callback; the controller now retains the last focused header control only across that boundary and clears ordinary focus departures.

The 12-page prelaunch build passed its disabled-inquiry and labelling checks. See [verification data](verification.json) for final checks and [bundle inventory](bundle-inventory.json) for equivalent-build byte counts. Shared inline JavaScript grows from 2,221 to 4,048 raw bytes (1,037 to 1,581 gzip bytes); external JavaScript hashes are unchanged. CSS grows by 95 raw bytes and 20 gzip bytes. No dependency is added. These are bundle sizes, not runtime speed measurements.

An independent source review checks the controller, focus rules, and tests. Runtime evidence uses Chromium on Linux; it does not establish Safari or Firefox behavior. Missing APIs are simulated in Chromium. Full commercial-launch gates remain open; inquiry submission stays disabled.

## Reproduce

```sh
npm run check:docs
npm run typecheck
npm run lint
npm run format:check
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/navigation-motion.spec.ts --workers=2
npm run build:prelaunch
```

To regenerate media, serve the baseline prelaunch build on port 4335 and the candidate prelaunch build on port 4325, then run `node scripts/capture-menu-review.mjs`. `BEFORE_URL`, `AFTER_URL`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can override defaults. Playwright video recording and ffmpeg/ffprobe must be installed. The cloud capture uses `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media` for its ffmpeg executable. Do not rebuild the candidate while tests or captures are using its output.
