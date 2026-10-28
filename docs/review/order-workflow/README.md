# Order-change workflow review

This revision of PR #31 follows the owner’s requested order-change example. It replaces the previous four-stage email-history diagram with five stages:

Request arrives → look up past emails and context → add tone and voice → draft a document → send the email.

The incoming request asks to change an order to a matte finish. Earlier emails provide the Friday-update context. The sample reply confirms the change and promises that update. All snippets are fictional and labelled illustrative. The website reads no inbox and sends no email.

## Icons and movement

One carrier follows the chain over 6.8 seconds and stops. Its icons change from a request bubble to a thinking bubble across both lookup and tone stages, then a document at the draft stage, and finally an envelope at delivery. Static stage markers use those same icons, including both thinking bubbles. There are no dot markers.

Human approval remains the default. Automatic send is an alternative under agreed rules. Pause, Resume, Replay, offscreen/document pausing, responsive position preservation, reduced motion, and unsupported-API fallbacks remain available. Text stays stationary and at least 15px.

## Before and after

Baseline: PR #31 at `5343b13`, not the published site.

| View | Previous | Revised |
| --- | --- | --- |
| Phone | [Before](before/example-390.png) | [After](after/example-390.png) |
| Narrow phone | [Before](before/example-320.png) | [After](after/example-320.png) |
| Tablet | [Before](before/example-768.png) | [After](after/example-768.png) |
| Desktop | [Before](before/example-1440.png) | [After](after/example-1440.png) |

[Phone video](videos/phone-diff.mp4), [desktop video](videos/desktop-diff.mp4), [reduced-motion video](videos/reduced-motion-diff.mp4), [JavaScript-disabled video](videos/no-javascript-diff.mp4).

Actual animation phases: [request](after/request-390.png), [context lookup](after/history-390.png), [tone and voice](after/voice-390.png), [document draft](after/document-390.png), [email](after/email-390.png). [Layout evidence](layout-evidence.json) records glyph opacity and carrier positions.

## Throughput checkpoint

- Blocking first steps: inspect the current chain, save an immutable baseline, and map the requested five-stage sequence and icon timing.
- Independent workstreams: the implementation owner changes only content/component/controller; parent owns tests, capture helper, media, and PR; an independent reviewer inspects source without mutation.
- Shared mutable state: baseline has a separate build/server; candidate tests, build, and captures run sequentially against generated output.
- Smallest safe decomposition: retain the existing native controller and add one stage and one thinking glyph. No new library, provider, or external integration.

Prove It Works shaped verification: sample the real moving carrier at every node, inspect both thinking phases, and record both delivery choices. Automated tests cover keyboard selection, five-stage alignment and icon changes, finite completion, pause preservation, visibility, resize, reduced motion, missing APIs, no JavaScript, and responsive readability. Original hero and example rows are preserved.

## Verification and limits

All 15 workflow browser checks and 44 unit tests pass. Typecheck, lint, formatting, and the 12-page prelaunch build pass. The broader browser run passed 45 checks, including all 11 page accessibility scans, and hit the known Services disclosure-click failure tracked in issue #29. No assertions were weakened. [Verification](verification.json) records results and pixel-identical original hero sections at 320, 390, 651, 768, and 1440px. An independent source reviewer found no substantive issues. Review media uses Chromium/Linux, not real devices or other engines. It does not establish WCAG compliance or performance scores. Fictional copy requires owner editorial review. Keep PR #31 unmerged and auto-merge off until explicit approval.

Reproduce with prelaunch builds of `5343b13` and the revised commit, served on ports 4349 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-email-workflow-review.mjs`.
