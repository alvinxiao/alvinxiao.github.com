# Reveal activation review

Refs #29. This fixes a reproducible mechanism for a missed native disclosure click. The separate fragment-test scroll synchronization is in open PR #36. Both PRs require owner approval, and #29 remains open.

## Cause and change

The reveal controller cancels an entrance when focus enters its section. A pointer press focuses the summary between pointer-down and pointer-up. Canceling the reveal removes its 16px translation, so the summary can move out from under the pointer. Pointer-up and click then target the surrounding `DETAILS`, whose default action does not toggle the disclosure.

The controlled regression holds the site's actual reveal animation at its first frame. It uses native mouse, touch, and keyboard events; it does not inject a fake disclosure or force a toggle. The pointer case fails against approved master `031a06c`: the disclosure stays open after the click. This demonstrates the mechanism, without claiming every historical intermittent failure had the same cause.

The focus handler now preserves an entrance while its focused control is `:active`. The document's bubbling click handler settles only reveal ancestors containing the clicked target, after native click target selection. Keyboard and programmatic focus still settle immediately. No pointer-state registry, timers, synthetic clicks, or layout changes are added.

An initial broad click handler could settle later reveals after a page-gutter click. Independent review caught that before commit. The final handler affects only ancestors of the clicked target, and a regression verifies that a native background click leaves a later reveal pending.

## Evidence

The videos clearly label the controlled first-frame hold, then show native clicks on the same Services summary. Before remains open; After closes. A final labeled native Space action reopens the candidate disclosure. These recordings deliberately pause the real entrance to expose a narrow timing window. They are not recordings of uninterrupted autoplay or a claim about how often visitors encounter the issue.

Screenshots show the resulting disclosure area at phone and desktop widths. `verification.json` records pointer-down, focus, pointer-up, click, and toggle targets and geometry. The baseline click targets `DETAILS`; the candidate click targets `SUMMARY` without a focus-induced position jump.

Reproduce with a master prelaunch snapshot on port 4355 and a fresh candidate prelaunch build on port 4340:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  node scripts/capture-reveal-activation-review.mjs
```

## Verification

- Baseline held-reveal pointer regression fails at the expected native closed-state assertion.
- Candidate reveal/activation/disclosure suites: 20 cases pass. The new tests cover pointer activation at 320/390/768/1440px, keyboard Space, touch, and preserving later reveals after background clicks.
- Existing cases cover immediate keyboard focus settlement, one-shot reveals, initial/runtime reduced motion, missing observers, print, native disclosure reversal, enlarged text, and no JavaScript.
- Typecheck, ESLint, formatting, and prelaunch output checks. No content, layout, typography, dependencies, providers, or inquiry configuration change.
- Independent source review found no further issues after narrowing click settlement.

Chromium 154 on Linux only. Other engines, real devices, screen readers, and native browser zoom are unverified. No performance or WCAG conformance claim.

## Throughput checkpoint

- Blocking first steps: inspect old failure logs and reveal event order, reproduce actual native event retargeting, and prove the regression fails against master.
- Independent workstreams: one owner for the reveal controller; parent owns regression tests and media; an independent reviewer checks behavior and affected consumers.
- Shared mutable state: source/test/evidence ownership is disjoint; candidate builds, tests, and recording are serialized. Baseline builds run in an immutable archive.
- Smallest safe decomposition: one controller owns reveal settlement, so the fix stays there rather than adding special disclosure behavior.

Fix Root Causes shaped the event trace and reproduction. Prove It Works shaped the baseline failure, candidate assertions, and native-action recordings.

Keep this PR unmerged with auto-merge off until owner review.
