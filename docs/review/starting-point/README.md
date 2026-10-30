# Homepage starting point review

Closes #38. The owner requested one bold change to improve the experience or conversion path. This PR replaces Home's generic closing invitation with a full-width, deep-teal starting-point chooser. It is built from approved master `031a06c`, without other unapproved PRs.

## Intended effect

A blank inquiry can be difficult to start. Visitors can now choose a familiar situation and see a relevant existing service, its approved summary, and a tailored contact link before leaving Home. A generic contact link remains available without choosing anything.

The conversion benefit is a design hypothesis. No conversion increase has been measured, and no analytics or tracking are added.

The new invitation and labels are proposed copy for owner review. Service names, summaries, scope destinations, and inquiry categories come from existing service data. No new offer, price, qualification, guarantee, or provider is introduced. Prelaunch sending remains disabled.

## Design decision

Two prototypes were compared before implementation. Flat link cards were easy to scan but repeated the existing Services grid. The split chooser creates a distinct visual ending and lets visitors explore a next step immediately. Prototype screenshots are retained in `prototypes/`; they are design sketches, not the final implementation.

The final section uses the current palette, large editorial type, familiar icons, and native radio controls. Selection changes a shared result panel with a short transition. Overlapping panels reserve their maximum height, so the section does not jump between choices. Hidden panel content and links leave the accessibility tree and tab order.

The chooser uses CSS and native controls, with no added browser JavaScript. It works without JavaScript. Contact preselection continues to use the existing Contact script; without JavaScript, the destination and editable form remain available but automatic preselection is not claimed.

## Evidence

Before screenshots show the old Home closing CTA. After screenshots show each of the three choices at 320, 390, 768, and 1440px. Phone and desktop videos label the comparison, each native selection, and navigation to Contact with the chosen interest. Sending remains disabled in the recording.

`verification.json` compares all Home text outside the replaced section and the external script inventory against master. Both are unchanged, including the hero, workflow example, biography, service summaries, and resource content.

Reproduce with a master prelaunch snapshot on port 4355 and a fresh candidate prelaunch build on port 4340:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  node scripts/capture-starting-point-review.mjs
```

## Verification

Five browser cases cover all choices, approved service copy, editable Contact preselection, no selection-triggered fetch/XHR, native keyboard arrows and links without JavaScript, touch navigation, open service disclosures, stable height and no overflow at four widths, 15px minimum text, and 44px result-link targets. Axe scans pass on the new section in all three states after the finite transition completes.

Forced-colors checks verify native radio appearance, checked state, visible result, and keyboard focus. A forced-colors fallback was added after independent review found that custom background/shadow indicators could disappear. Decorative option icons inherit their label color to remain visible on the deep-teal background.

Typecheck, lint, formatting, prelaunch output checks, and documentation links are recorded with the PR. The prelaunch capture verifies the Contact interest and disabled submit button.

Verification is limited to Chromium 154 on Linux. Other engines, real devices, screen readers, and native zoom are unverified. No full-site WCAG conformance or performance claim is made.

## Throughput checkpoint

- Blocking first steps: inspect specifications, current CTA and contact routing; compare two prototypes before source implementation.
- Independent workstreams: one owner implements the component and Home caller; parent owns tests, evidence, and documentation; independent reviewer checks accessibility, behavior, and scope.
- Shared mutable state: source and verification artifacts use disjoint ownership. Candidate tests, builds, and recordings run sequentially against one dist directory; baseline uses an immutable snapshot.
- Smallest safe decomposition: one component owns the authored choices and native selection display. The shared ClosingCTA and other pages remain unchanged.

Experience First shaped the direct, optional next step. Exhaust the Design Space shaped the comparison with a flat card grid. Prove It Works shaped the native interactions, unchanged-content comparison, and disabled-send check.

Keep this PR unmerged and auto-merge off until owner review.
