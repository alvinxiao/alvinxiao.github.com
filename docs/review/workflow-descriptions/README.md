# Read and explore each workflow step

PR #31 now changes the bottom example box as the animation reaches each step. The full journey takes 18 seconds, up from 6.8 seconds. Each description has about 3.6 seconds before the next step arrives, with a 2.88-second stationary hold followed by a short transition. The final stage holds until completion.

The box explains the incoming order-change request, past-email lookup, tone and voice, the draft itself, and the selected delivery option. Copy remains short and fictional. The draft keeps the matte-finish request and Friday-update example.

Pause enables the full area of each step as a native button. Clicking or pressing Enter on a step moves the carrier, progressive icon reveals, current-step indicator, and description together, and keeps the animation paused. Resume continues from that point. Replay starts over. Completed journeys can also be explored.

Description panels share a grid area and reserve their maximum height, so changing stages or delivery options does not push surrounding content around. Automatic playback does not send live-region announcements. Buttons expose their label, controlled description, and current-step state.

Reduced-motion visitors can choose steps without movement. With JavaScript unavailable or animation APIs missing, the complete static diagram and final example email remain readable. The site reads no inbox and sends no email.

## Before and after

Baseline is `4bab333`, the previous PR revision, not the published site.

[Uninterrupted human-approval video](videos/approval-uninterrupted.mp4).

[Phone comparison video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [reduced-motion video](videos/reduced-motion-diff.mp4), [JavaScript-disabled video](videos/no-javascript-diff.mp4).

Normal-motion comparisons show a complete uninterrupted human-approval run first, then explicitly labelled paused navigation, Resume, and a complete automatic-delivery run. The captions distinguish the previous 6.8-second animation from the revised 18-second one.

The earlier recording mixed unlabelled manual step jumps into the initial approval run. It made intentional seeking hard to distinguish from playback trouble. The standalone approval clip now records the current site without any pauses, step selections, or delivery-mode changes. Its captions mark the final reading hold and completion. [Playback samples](approval-playback.json) verify ordered stages, nondecreasing elapsed animation time, and final completion.

This recording revision changes the capture helper and review evidence. No website source changes were made, and a playback fault has not been reproduced in the current site. A CI test also read the animation time before the browser completed its pending Pause operation. The test now waits for native animation readiness before reading that time, while retaining the strict resize-preservation assertion. Five repeated regression checks pass with the original strict resize-preservation assertion.

| Phase | Previous fixed box | Revised description |
| --- | --- | --- |
| Phone, context lookup | [Before](before/example-390.png) | [History](after/history-390.png) |
| Phone, tone and voice | [Before](before/example-390.png) | [Voice](after/voice-390.png) |
| Desktop, draft | [Before](before/example-1440.png) | [Draft email](after/document-1440.png) |

[Layout evidence](layout-evidence.json) records actual current-step state, description, glyphs, and marker opacity at all five stages. The repeatable capture helper uses the real paused step buttons to select the requested phase.

## Verification

All 17 workflow browser checks, 44 unit tests, typecheck, lint, formatting, and the 12-page prelaunch build pass. Browser coverage checks the longer reading holds, real automatic description changes, paused pointer and keyboard seeking, retained pause after delivery changes and resize, Resume, stationary panel geometry, exclusive delivery descriptions, icon arrival boundaries, and existing motion and static fallbacks.

Independent review caught and resolved delivery-description visibility: only the selected mode is visible, and hidden future panels cannot expose their descendants. Chromium/Linux evidence does not verify other engines, real devices, screen-reader output, or native zoom, and does not establish WCAG compliance. Fictional copy remains subject to owner editorial review. No new library or provider dependency is added.

## Throughput checkpoint

- Blocking first steps: trace the shared animation controller, preserve the previous build, and define a shared timing registry and stage descriptions.
- Independent workstreams: one source owner changes content/component/controller; parent owns tests, media, and PR; a reviewer reads source independently.
- Shared mutable state: baseline has a separate build and server; candidate tests, build, and captures run sequentially against generated output.
- Smallest safe decomposition: extend the existing native timeline rather than adding a separate timer or animation library. The description follows the carrier’s actual elapsed time.

Prove It Works shapes verification: exercise actual native step buttons and read the displayed state while real playback runs.

To regenerate only the recordings, set `ONLY_VIDEOS=1`. Reproduce using prelaunch builds of `4bab333` and the revision on ports 4351 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-email-workflow-review.mjs`.

Keep PR #31 unmerged with auto-merge off until owner approval.
