# Reveal workflow icons on arrival

Historical packet. The [step-description revision](../workflow-descriptions/README.md) is the current review.

PR #31 revision: keep future step icons hidden until the moving carrier reaches them. Reached icons stay visible. Replay resets the sequence. The first request icon appears at the start.

The existing 6.8-second timeline now owns five marker reveals alongside carrier movement and glyph changes. Each icon switches on at its exact arrival time: 0, 1632, 3264, 4896, and 6528ms. All text and layout remain stationary. No copy or business facts change.

Pause, offscreen and hidden-document states freeze the reveals with the carrier. Resize rebuilds the same elapsed phase. Reduced motion, no JavaScript, and unavailable APIs show all icons immediately as a complete static diagram.

## Review evidence

Baseline is `56e30ea`, the previous PR revision, not the published site.

[Phone before/after video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [reduced-motion video](videos/reduced-motion-diff.mp4), and [JavaScript-disabled video](videos/no-javascript-diff.mp4).

| Phase | Previous | Revised |
| --- | --- | --- |
| Phone, tone and voice | [Before](before/example-390.png) | [Future icons hidden](after/voice-390.png) |
| Desktop, request | [Before](before/example-1440.png) | [Only request revealed](after/request-1440.png) |
| Complete static fallback | [Before](before/example-320.png) | [All icons visible](after/example-320.png) |

[Layout evidence](layout-evidence.json) records actual marker opacity at all five phases for phone and desktop. The capture helper checks reached icons are visible and future icons are hidden, rather than relying on screenshots alone.

## Verification

All 15 workflow browser checks pass. The phase test verifies every icon is hidden one millisecond before arrival and visible at arrival, stays visible after arrival, and hides future icons after Replay. Existing tests cover pause, resize, visibility, finite completion, native delivery controls, reduced motion, no JavaScript, missing/throwing APIs, and 320–1440px readability. Typecheck, lint, formatting, and the 12-page prelaunch build pass. An independent source reviewer found no substantive issues.

Prove It Works shaped the verification: test actual icon opacity at arrival boundaries and record real playback. Evidence uses Chromium/Linux, not other browsers or real devices. No new dependency, provider, network request, or email sending is introduced.

## Throughput checkpoint

- Blocking first steps: inspect the existing shared timeline and save a separate immutable baseline.
- Independent workstreams: implementation owns only the controller; parent owns tests, capture helper, and evidence; independent review is read-only.
- Shared mutable state: candidate tests, build, and captures run sequentially against generated output. Baseline has its own build and server.
- Smallest safe decomposition: five marker animations join the existing owned timeline, reusing cancellation, pause, replay, and resize behavior.

Reproduce using prelaunch builds of `56e30ea` and the revision, served on ports 4350 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-email-workflow-review.mjs`.

Keep PR #31 unmerged and auto-merge off until owner approval.
