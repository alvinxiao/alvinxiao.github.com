# Review the prelaunch implementation

The implementation supports a local review site and an owner-authorized public prelaunch. No business identity, biography, contact address, prices, provider endpoint, or privacy policy has been invented. The empty fields and false flags in `src/content/approval.json` deliberately block the full commercial-launch build. The separate prelaunch build publishes progress with inquiries disabled and the remaining gates visible at `/launch-checklist/`.

## Inspect the change

The technical implementation uses Astro static output, strict TypeScript, Tailwind through its Vite plugin, Markdown resource articles, and one focused inquiry script. There is no React runtime, backend, analytics, booking, payment, or external font service.

- `src/content/site.ts` and `src/content/services.ts` centralize controlled copy and stable service IDs.
- `src/content/approval.json` contains the owner-supplied public facts and explicit approval status. The private notification email belongs only in the provider dashboard.
- `src/pages/`, `src/layouts/`, `src/components/`, and `src/styles/` provide the required routes and reusable responsive patterns.
- `src/lib/inquiry/model.ts` defines the interest allowlist, validation limits, and submission state variants. `src/scripts/contact.ts` owns browser interaction and the provider boundary.
- `scripts/check-release.mjs`, the Vite configuration hook, and `scripts/check-output.mjs` guard production configuration and generated output.
- `.github/workflows/verify.yml` verifies pull requests. It has no deployment job or write permission. A separate `publish-prelaunch.yml` workflow publishes the owner-authorized prelaunch.
- `tests/` and `scripts/test-release-build.mjs` exercise the user journeys and actual build gate. Synthetic approved data is confined to a disposable temporary build and removed afterward.

Preview-only endpoint/email overrides support intercepted integration tests. Production ignores them and uses the approved configuration. A test response confirming acceptance is not evidence of provider storage or email delivery.

## Review the design proposal

The proposal uses a system sans-serif stack, cream canvas, dark ink, teal actions, peach accents, restrained rounded corners, and an original geometric process illustration. It loads no external fonts or stock photography.

The dark teal action color is `#1c635e`. Calculated contrast is 7.01:1 for white text on that background. Ink `#24313b` on canvas `#f8f7f3` is 12.42:1. Muted text `#53615f` is 6.04:1 on canvas and 5.52:1 on mist `#e5efec`. Automated and manual checks supplement these calculations. They do not establish WCAG conformance.

Generated mobile and desktop screenshots are in `test-results/` and the Playwright HTML report. Treat the design as a proposal until the owner reviews typography, spacing, illustration, and the palette. Any static review artifact remains nonproduction.

## Keep milestone approvals separate from implementation

| Milestone | Technical progress | Remaining gate |
| --- | --- | --- |
| M0 | Repository/history/Pages inspected, legacy Git bundle verified and restored, stack exercised locally | Live rendered site/DNS access, current Formspree terms, owner decisions about legacy URLs and release controls |
| M1 | Central content and approval structure present; approved hero and summaries used | Real identity, biography, public and notification emails, service policies/prices, final privacy, resource editorial approval |
| M2 | Responsive theme and illustration implemented for review | Owner visual sign-off on actual screenshots |
| M3 | Static tooling, lockfile, strict types, production guard, verification CI implemented | Remote CI execution and owner review of eventual publication controls |
| M4 | Required pages and three draft Markdown articles implemented | Content approvals; About and privacy remain explicitly unfinished review pages |
| M5 | Adaptive form and failure recovery implemented and tested with synthetic intercepted requests | Real endpoint, free-plan terms, provider validation/spam configuration, stored record, delivered owner notification, deletion test |
| M6 | Local verification and repeatable test/measurement tooling prepared | Manual screen-reader and zoom review, final content/design sign-off, real provider test, hosting changes, rollback rehearsal, explicit merge and release approval |

The review branch contains technical work across milestones. This does not mark the owner-dependent M1, M2, M5, or M6 exit gates complete.

## Check the form behavior

The initial form is safe before JavaScript initializes. Its button starts disabled and the method is POST. Without JavaScript, the approved email fallback is available when configured. Mobile navigation also remains available without JavaScript.

The browser validates the required fields and length limits, normalizes service preselection through an allowlist, and clears contextual input when the category changes. While a request is pending, duplicate attempts are blocked. Explicit rejections retain input. Timeout, interrupted connection, gateway/server failures, and unclear acceptance show an uncertainty warning before a deliberate retry. No automatic retry is performed.

Only an explicit successful provider response permits confirmation navigation. A five-minute, single-use session marker contains no inquiry data. Direct visits, expired markers, and unavailable storage retain neutral thank-you messaging. This marker is a UI cue, not a delivery receipt or security credential.

The site does not put inquiry contents into URL query strings, application logs, analytics, local storage, or session storage. The provider and the eventual email inbox have separate retention/deletion obligations that remain unverified.

## Reproduce verification

Run the commands in README.md. The browser suite builds the labelled preview and intercepts all synthetic Formspree requests. It never verifies a real inbox. Raw current-run results and screenshots are generated under `test-results/`; the interactive report is `playwright-report/index.html`.

For an optional local Lighthouse check, serve a built preview in the foreground, then run `CHROME_PATH=/usr/bin/chromium node scripts/measure-lighthouse.mjs`. The script uses Lighthouse 13.5.0 through npm, makes five interleaved mobile runs per Home, Services, and Contact route, checks request failures, and records medians and ranges. It requires network access for the measurement tool. Scores for this labelled local preview do not certify deployed production performance.

See `TESTING.md` for the final release acceptance criteria. A green local run does not close manual accessibility, provider, privacy, or publication gates.

## Release restrictions

The owner has authorized incremental public prelaunch merges and deployments while the commercial launch gates remain open. Use `npm run build:prelaunch` and publish its launch checklist. Full commercial launch still requires `PRODUCTION_CHECKLIST.md`; never mark unknown business facts or provider checks approved merely to satisfy `npm run build`. Follow `docs/OPERATIONS.md` for the separate publication modes and rollback.
