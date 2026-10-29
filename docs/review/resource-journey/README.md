# Resource journey review

Issue #26 makes the existing guides an optional reading path: AI basics, one small experiment, then choosing a workflow. This PR branches from approved master `031a06c`. It does not include open PRs #28, #30, #32, or #34.

The index and article endings use one ordered ID registry. A pure resolver validates the registry with Zod and rejects missing, duplicate, or omitted guides at build time. Numeric ranks in individual frontmatter were considered, but distribute one sequence across files and still need cross-collection checks. Adding a guide now requires adding its ID to the registry.

Previous and Next links use the existing guide titles and descriptions. They work without JavaScript and do not mark reading progress, gate access, or scroll automatically. Article prose, artwork, heading IDs, direct URLs, All resources navigation, and inactive inquiries are preserved. Existing inline recommendations remain in the articles.

## Evidence

Screenshots cover first, middle, and last endings at 320, 390, 768, and 1440px. Phone and desktop videos label each scroll comparison and the final native link action. These are navigation demonstrations, not new animation behavior.

`verification.json` compares built article text and heading IDs against the immutable master snapshot. The capture script also checks each ending's title and description against its destination page. No external script assets are added.

Reproduce with a master prelaunch snapshot on port 4355 and the candidate prelaunch build on port 4340:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-resource-journey-review.mjs
```

## Verification

- Typecheck, ESLint, formatting, unit tests, and prelaunch output checks.
- Three new browser tests cover authored index order, first/middle/last endings, native keyboard/Back/touch navigation, no JavaScript, reduced motion, mobile reflow, 15px minimum descendant text, and 44px minimum link height.
- Existing five resource motion tests passed.
- The first CI run caught an accessibility scan during the existing header fade-in. The test now waits for finite entrance animations to finish and asserts full header-link opacity before scanning, matching the existing site test protocol. No product animation or contrast rule changed.
- Axe scans within each article's main landmark passed. The initial unrestricted scan also found two existing shared-page issues, reproduced on master: the wordmark's accessible name omits its visible descriptor, and the preview banner is outside landmarks. They remain outside this PR's scope; no full-page accessibility or WCAG conformance claim is made.
- Chromium 154 on Linux only. Other engines, real devices, screen readers, and native browser zoom remain unverified.

## Throughput checkpoint

- Blocking first steps: read specifications and issue, inspect existing templates, preserve master snapshot. Complete.
- Independent workstreams: one source owner for model and templates; parent owns tests, capture, and documentation; independent read-only review found no material issues.
- Shared mutable state: source and evidence files separated; candidate builds, browser tests, and capture serialized. Baseline builds use a separate immutable snapshot.
- Smallest safe decomposition: keep the shared sequence and both consumers with one source owner to avoid competing edits.

Model the Domain shaped the shared ordered registry. Prove It Works shaped the built-page preservation comparison and native interaction checks.

No merge, deployment, or auto-merge is authorized by this review packet. Owner approval remains required.
