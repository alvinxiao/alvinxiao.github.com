# Services comparison review

Issue #22. This branch is independent of Home PR #28 and starts from master `e9cf78be16adc0cf5b7116118ff580f720f78696`. Owner approval is required before merge.

## Design

Replace the four jump pills with four linked comparison rows. Each row reads the existing service label, name, and summary from `src/content/services.ts`. Desktop aligns the starting point and summary in columns. Mobile stacks them within a row. Links retain the existing section fragments and visible focus outline. No new service copy, recommendation, inclusion, price, or promise is introduced.

A semantic list fits these four destinations better than a table. A table would need new column labels and a separate mobile semantic treatment without adding a useful comparison dimension. Repeating all inclusions and exclusions would make this overview harder to scan, so those stay in the eight open disclosures below. No new runtime or motion controller is needed.

Model the Domain keeps the existing services array as the single content owner. Prove It Works requires checking the actual links, editable Contact preselection, open disclosures, and mobile reflow rather than relying on source review. An independent reviewer found no material source findings.

## Throughput checkpoint

- Blocking first steps. Read the central service content, native fragment behavior, existing tests, and owner review rules before changing the overview.
- Independent workstreams. One implementation owner edits Services markup, CSS, and browser checks. Parent owns builds, capture helper, evidence, and PR. A separate reviewer inspects source without writing.
- Shared mutable state. Candidate tests and recordings run sequentially because they share generated output. Baseline builds use a separate temporary snapshot.
- Smallest safe decomposition. Reuse the central data and native links in the existing page. Do not add a new component, state model, runtime, or content registry for one overview.

## Verification

The targeted browser run finished with 15 passes and one failure. All four new comparison checks passed, including exact source content, five-width layout, limited root-font enlargement, next-Tab continuation into each selected Contact button, all four editable inquiry preselections, touch, and no JavaScript. All six disclosure checks passed. The existing native fragment viewport failure also reproduces on unchanged master and is tracked in [issue #29](https://github.com/alvinxiao/alvinxiao.github.com/issues/29). It is not claimed fixed. See [browser results](browser-verification.json).

Root-font enlargement changes rem-based text only. It does not reproduce native browser zoom or enlarge fixed-pixel text. Chromium/Linux checks do not establish real-device, Safari, Firefox, or screen-reader behavior. The overview adds vertical reading distance before the details, balanced by making the service distinctions available before choosing a link.

Keep this PR unmerged with auto-merge off until the owner reviews the screenshots and recordings. Prelaunch inquiries remain disabled. No business content approval is inferred from passing tests.

## Before and after

| View | Before | After |
| --- | --- | --- |
| 320px comparison | [Before](before/services-320-comparison.png) | [After](after/services-320-comparison.png) |
| 390px comparison | [Before](before/services-390-comparison.png) | [After](after/services-390-comparison.png) |
| Desktop comparison | [Before](before/services-1440-comparison.png) | [After](after/services-1440-comparison.png) |
| Phone detail transition | [Before](before/services-390-details.png) | [After](after/services-390-details.png) |

[Phone video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), and [reduced-motion video](videos/reduced-motion-diff.mp4) show matching viewport sizes, the overview, and a native link into Workflow Audit. The complete comparison is captured separately because four readable rows exceed a compact phone viewport.

[Layout evidence](layout-evidence.json) confirms unchanged full detail text at 320, 360, 390, 768, and 1440px, no horizontal overflow, and eight initially open disclosures. The capture helper is `scripts/capture-services-comparison-review.mjs`. Both builds use `npm run build:prelaunch`; serve the baseline on port 4342 and candidate on port 4340, then run the helper with `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

Typecheck has zero errors, warnings, or hints. ESLint, Prettier, all 44 unit tests, and both 12-page prelaunch checks pass. [Build inventory](build-inventory.json) records CSS growth from 33,028 to 33,641 raw bytes, or 7,713 to 7,833 gzip bytes. All three external JavaScript hashes match. These are bundle counts, not performance measurements. Full browser and release-build verification also run in the PR's CI.
