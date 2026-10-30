# Native Services interaction investigation

Refs #29. This PR addresses the fragment-navigation test race only. The separate reported disclosure-click failure remains unresolved.

No website files change. Before/after screenshots would show the same site, so this test-only PR uses reproducible browser observations and the code diff for review.

## Demonstrated cause

The test programmatically focuses the Problem-Solving link after visiting Getting Started, then immediately presses Enter. With native smooth scrolling enabled, `focus()` returns before the browser finishes scrolling the link into view. That scroll can compete with the following fragment navigation. The URL changes correctly while the selected heading remains below the viewport.

The retained historical baseline trace in the cloud workspace failed the selected-heading viewport assertion immediately after this focus/Enter sequence. The current baseline's reported test cases passed six repeats each, so those twelve passes alone did not reproduce the older failure.

A controlled browser probe makes the competing-scroll case repeatable. It opens Services, follows Getting Started, allows its initial scroll to finish, focuses Problem-Solving, and compares immediate Enter with Enter after eight consecutive stable scroll frames. Both arms use the same site artifact and browser. The probe samples the resulting target and heading positions after 1.2 seconds; these sampling delays are diagnostic controls, not added test sleeps.

The candidate test observes vertical scrolling until its position changes by less than 0.1px across eight consecutive animation frames. It waits after fragment arrival and after bringing a link into view or focusing it, before starting the next native action. A keyboard-only first attempt passed 19 of 20 repeated cases, then failed at the earlier repeated-click viewport assertion. The final change synchronizes the complete sequence instead of only Enter. It preserves the URL, viewport, underline, repeated-target, and Back assertions. No forced clicks, disabled rules, timeout increases, CSS changes, or JavaScript interception are introduced.

This supports synchronizing the automation with the browser's focus scroll. It does not establish a production application defect or claim to fix every rapid native keyboard interaction in Chromium.

The initial focus probe recorded 8/10 offscreen outcomes with immediate Enter and 0/10 after settled focus. The reusable diagnostic's independent run recorded 7/10 and 0/10 respectively. The second run also closed the first disclosure in all 20 attempts. These small local samples demonstrate the competing-scroll condition; they are not visitor failure-rate estimates.

## Disclosure result

A separate event-traced diagnostic exercised 25 native summary clicks following Home, About, and Services navigation. All 25 closed the first disclosure. No reproduction or root cause was established for the older disclosure failure. Its test remains unchanged, all eight disclosures still start open, and #29 must remain open.

## Reproduce

Serve a fresh baseline preview build on port 4340, then run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  SERVICES_REVIEW_OUTPUT=/tmp/services-native-diagnosis.json \
  node scripts/diagnose-services-native.mjs

PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  npx playwright test tests/browser/anchor-feedback.spec.ts tests/browser/site.spec.ts \
  --grep 'native mouse, keyboard, Back|approved identity, concrete workflow' \
  --workers=1 --repeat-each=10
```

The diagnostic accepts `SERVICES_REVIEW_URL` and `SERVICES_REVIEW_TRIALS`, defaulting to port 4340 and ten trials per arm. Its JSON records the browser version and individual outcomes. `diagnosis.json` is the captured run against approved master `031a06c`. Results describe this local sample, not a measured failure rate for visitors.

## Scope and verification

The final repeated interaction run passed all 20 cases: ten fragment-navigation cases and ten unchanged identity/disclosure cases. Typecheck, ESLint, formatting, and documentation-link checks also passed.

The source change is limited to one test file and a reusable diagnostic script. The script is not imported into the website or required by CI. Independent read-only review found no material issues. Chromium 154 on Linux only; no other-engine or real-device claims.

Fix Root Causes shaped the controlled immediate-versus-settled experiment. Existing assertions remain the acceptance criteria.

## Throughput checkpoint

- Blocking first steps: inspect #29, historical baseline trace, current tests, native markup, and reveal/scroll code; reproduce before editing.
- Independent workstreams: delegate owns the one test edit; parent owns diagnostic script, evidence, and verification; independent reviewer reads both.
- Shared mutable state: file ownership is disjoint; diagnostic run finishes before candidate browser builds/tests begin.
- Smallest safe decomposition: one test owner because this is one interaction sequence. No production change is supported by the evidence.

Owner approval remains required before merge. No deployment or auto-merge is armed.
