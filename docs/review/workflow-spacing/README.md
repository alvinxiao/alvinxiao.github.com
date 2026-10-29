# Workflow selection spacing

The paused step’s selection outline was tangent to the icon on phones and to its top edge on desktop. This revision draws the selection, hover, and keyboard-focus decoration 8px outside the existing button bounds.

Only CSS changes. Native button hit regions stay unchanged, so neighboring steps do not gain overlapping targets. Icons, text, carrier route, reading pace, and step-selection behavior stay in place. The selected outline remains 1px. The existing stronger keyboard-focus ring is preserved on the expanded decoration.

## Before and after

Baseline: master `373be53`, the approved workflow from PR #31. This change is separate from the resource contents work in PR #32.

| View | Before | After |
| --- | --- | --- |
| Phone close-up | [Before](before/detail-390.png) | [More space](after/detail-390.png) |
| Desktop close-up | [Before](before/detail-1440.png) | [More space](after/detail-1440.png) |
| Phone keyboard focus | [Before](before/keyboard-390.png) | [After](after/keyboard-390.png) |

[Phone comparison video](videos/phone-diff.mp4) · [Desktop comparison video](videos/desktop-diff.mp4)

The recordings explicitly label paused step selections and their intentional jumps. They compare the first, middle, and final steps without presenting those clicks as automatic playback.

## Verification

All 17 workflow browser checks, typecheck, lint, formatting, and the 12-page prelaunch build pass. [Geometry evidence](geometry.json) checks the first, middle, and final selected stages at 320, 390, 768, and 1440px: actual button, icon, and text rectangles match the baseline exactly, targets remain at least 44px high, and the page has no horizontal overflow.

Independent CSS review found no substantive issue. Visual verification covers the selection border and keyboard focus. Chromium/Linux evidence does not verify other engines, real devices, native zoom, or screen-reader output and does not establish WCAG compliance. No article, business copy, animation timing, JavaScript, provider, or dependency changes.

## Throughput checkpoint

- Blocking first steps: inspect the tangent selection bounds and preserve a master baseline separately from PR #32.
- Independent workstreams: one source owner changes the component CSS; parent owns capture, verification, and PR; independent review is read-only.
- Shared mutable state: baseline has its own build/server. Candidate tests, build, and capture run sequentially against generated output.
- Smallest safe decomposition: a decorative pseudo-element adds breathing room without changing layout or native hit regions.

Prove It Works shaped validation: compare actual icon/text/button geometry and inspect the rendered border in close-ups.

Reproduce with prelaunch builds of `373be53` and this revision on ports 4353 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-workflow-spacing-review.mjs`.

Keep this PR unmerged and auto-merge off until owner visual approval.
