# Email-history workflow review

PR #31 now follows the owner's requested example: use historical customer emails and tone/voice to create an email for human approval or automatic sending. This supersedes the earlier shop-question comparison. The previous/revised evidence uses the prior PR version at `498304c` as its baseline; neither version is the published site.

## The chain

Past customer emails → tone and voice → draft email → delivery.

One moving carrier starts as a blip, blends into a document near the tone/context stage, then becomes an envelope as it reaches the draft and travels to delivery. It is one physical carrier with synchronized glyphs, rather than separate stationary icons blinking. A 5.2-second pass finishes and stops. Replay explicitly starts another pass. Human approval is the default; the native radio can switch the final stage to automatic sending under agreed rules.

All labels and the prepared email remain stationary and readable throughout. The story uses fictional matte-finish and Friday-update preferences, with a short sample reply to Sam. The widget says "Illustrative workflow. No real emails are sent." It reads no inbox, calls no provider, and sends no messages. Automatic sending is a demonstrated workflow option, not a claim that this website sends mail or has a configured integration.

## Design decision

| Design | Mobile | Desktop | Decision |
| --- | --- | --- | --- |
| Straight four-stage chain | [Document phase](prototypes/a-390-document.png) | [Email phase](prototypes/a-1440-email.png) | Selected. One continuous journey makes the requested transformation easiest to follow. |
| Two input branches merging | [Document phase](prototypes/b-390-document.png) | [Email phase](prototypes/b-1440-email.png) | Emphasizes combining inputs but adds unnecessary path complexity on phones. |

Both actual prototypes were captured at 320, 390, and 1440px in blip/document/email phases. [Prototype metrics](prototypes/metrics.json) record no overflow. [A HTML](prototypes/a.html) and [B HTML](prototypes/b.html) preserve the alternatives. Production makes the first stage explicitly "Past customer emails" and adds robust viewport/document pause handling and API fallbacks.

Exhaust the Design Space led to the two concrete layouts. Model the Domain led to a single owned animation group and a set of independent pause causes. Prove It Works led to checking actual glyph opacity, carrier positions, responsive alignment, finite completion, and recorded movement.

## Before and after

| View | Previous shop example | New email chain |
| --- | --- | --- |
| 390px | [Before](before/example-390.png) | [Human approval](after/example-390.png) |
| 320px | [Before](before/example-320.png) | [Automatic send](after/automatic-320.png) |
| Desktop | [Before](before/example-1440.png) | [Human approval](after/example-1440.png) |

Actual carrier phases: [blip](after/blip-390.png), [document](after/document-390.png), and [email](after/email-390.png). Desktop [email phase](after/email-1440.png) shows the same carrier moving horizontally; mobile uses a vertical path with upright glyphs.

[Phone comparison video](videos/phone-diff.mp4), [desktop comparison](videos/desktop-diff.mp4), [reduced-motion comparison](videos/reduced-motion-diff.mp4), and [no-JavaScript comparison](videos/no-javascript-diff.mp4) show actual builds. Normal-motion recordings play both delivery paths. The phone recording uses labelled 390×1100 viewports to keep the comparison visible; compact phone layouts are captured separately.

## Playback and fallbacks

The new small browser controller owns the measured route and four synchronized Web Animations objects: one position animation and three glyph transitions. It measures the real stage centers rather than assuming fixed coordinates. Resize preserves elapsed phase and manual pause. Independent user, viewport, and document pause causes prevent visibility changes from overriding a manual pause.

The flow starts once when it enters view. Offscreen and hidden-document states freeze it. Pause/Resume and Replay are keyboard/touch controls. Changing delivery can replay an active/completed journey, while preserving a manual pause. Enabling reduced motion cancels the journey and shows the static diagram; disabling that preference does not automatically restart it. Replay may then be used explicitly.

No JavaScript, missing animation/observer APIs, or an unavailable animation implementation leave the complete static diagram and native endpoint choices usable. Controls appear only when playback is available. [Actual no-JavaScript automatic-send view](after/no-javascript-390.png) demonstrates that fallback. Text remains at least 15px and interactive targets at least 44px.

## Verification

All 15 targeted browser checks pass: seven cover the new flow and eight retain the original hero workflow checks. They verify intermediate movement, blip/document/envelope transitions, horizontal and vertical node alignment, real finite completion, pause/resume/replay, resize, document visibility, offscreen preservation, reduced-motion cancellation, no JavaScript, missing/throwing APIs, native endpoint choices, stationary text, and reflow at 320/390/768/1440px.

Typecheck, lint, formatting, 44 unit tests, and the 12-page prelaunch build pass. TypeScript callback declarations were made lexical so the validated DOM types remain narrowed inside the controller. No casts or repeated null guards were introduced to silence errors. The initial runtime checks passed before that type-only correction.

[Layout evidence](layout-evidence.json) records unchanged original example rows and actual phase samples. [Verification](verification.json) records final browser statistics, hero-section comparisons, and bundle inventory. The new native animation controller adds browser JavaScript deliberately for viewport-triggered playback, real pause/replay, and responsive phase preservation. No library or provider dependency is added. Bundle counts are not performance measurements.

All customer snippets, tone descriptors, sample reply, delivery labels, and workflow copy require owner editorial review. They are fictional, not client records, service guarantees, business policies, or claims of achieved results. Prelaunch inquiries remain disabled. Other-engine, real-device, native browser zoom, and screen-reader behavior remain unverified; Chromium/Linux evidence does not establish WCAG compliance.

## Throughput checkpoint

- Blocking first steps. Inspect the previous example and the new requested story. Render the linear and branched routes before choosing production shape.
- Independent workstreams. One prototype owner owns standalone designs, one implementation owner owns component/content/controller/browser checks, and parent owns builds/media/docs/PR. An independent reviewer reads source only.
- Shared mutable state. Candidate builds, tests, and recordings run sequentially against generated output. The previous PR version has its own immutable snapshot and server.
- Smallest safe decomposition. One scoped component, content registry, and native animation controller own this illustration. The existing hero controller and global styles remain untouched.

Reproduce with prelaunch builds of `498304c` and the revised commit, served on ports 4348 and 4340, then run `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-media PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-email-workflow-review.mjs`.

Earlier review packets and their capture helpers were removed from the final branch to keep one current packet. They remain in the PR history at `943753c` and `498304c`; their pinned links remain available. All original website copy, branding, biography, hero controls, service links, and example rows are preserved.

Keep PR #31 unmerged with auto-merge off until the owner reviews this version. PRs #28/#30 and investigation #29 remain separate.
