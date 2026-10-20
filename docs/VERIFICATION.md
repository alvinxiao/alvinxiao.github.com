# Verification record

The implementation was verified on October 20, 2026. The owner subsequently authorized public prelaunch updates while commercial launch gates remain pending. Those pending gates are published in `PRODUCTION_CHECKLIST.md` and `/launch-checklist/`.

## Local results

| Check | Observed result |
| --- | --- |
| Frozen dependency installation | `npm ci` completed successfully from the pinned lockfile. |
| Unit tests | 44 passed, including validation boundaries and every full-launch approval flag. |
| Full browser baseline | 48 passed before adding the public checklist, including provider simulations, accessibility scans, navigation, no-JavaScript behavior, and responsive screenshots. |
| Public checklist | Additional live-browser Axe scan passed on the built prelaunch artifact. |
| Public inquiry lock | A live-browser forced submit remained blocked and issued no POST request. |
| Actual build-gate integration | Unapproved commercial build rejected; public prelaunch with pending approvals built; synthetic fully approved commercial build passed; environment overrides rejected; leaked placeholder output rejected. |
| Public artifact | All 12 generated pages passed prelaunch label, checklist link, noindex, inactive form, fixture-leak, and private-key-marker checks. |
| Dependency audit | Latest all-dependency audit reported zero known vulnerabilities. |
| Source checks | Typecheck, ESLint, and Prettier checks passed during implementation. Publication CI reruns them on the exact pushed source. |
| Preservation | Complete legacy Git bundle verified, restored to a disposable bare repository, and checked with `git fsck --full`. Legacy commit also preserved as `archive/legacy-site-2026-10-20`. |

Provider simulations do not establish real Formspree storage, notification delivery, free-plan limits, or retention. No real inquiry was submitted. No Lighthouse score, manual screen-reader conformance, or full commercial-launch approval is claimed here.

## Acceptance mapping

| Requirement | Evidence |
| --- | --- |
| Visitor paths, route links, editable service selection | `tests/browser/site.spec.ts` |
| Required fields, email and length limits | `tests/unit/inquiry.test.ts`, `tests/browser/inquiry.spec.ts` |
| Conditional context exclusion and duplicate suppression | `tests/browser/inquiry.spec.ts` |
| Rejection, quota, server/gateway, malformed-response, network, and timeout recovery | `tests/browser/inquiry.spec.ts` |
| Neutral direct confirmation, consumed/expired marker, unavailable storage | Both browser suites |
| Sensitive contents kept out of navigation URLs, logs, and storage | Inquiry browser scenarios and source review |
| Commercial build fails closed; public prelaunch stays inactive | `tests/unit/release.test.ts`, `scripts/test-release-build.mjs`, `scripts/check-prelaunch.mjs` |
| Responsive overflow, reduced motion, keyboard and no-JavaScript navigation | Site browser suite and `docs/review/` screenshots |
| Full launch business, provider, manual QA, and release approvals | Pending in `PRODUCTION_CHECKLIST.md` |

## Review findings resolved

An independent review found a native GET submission risk before JavaScript initialization. The form now starts with a disabled submit button and POST method. A browser scenario verifies that Enter cannot place inquiry data in a URL without JavaScript.

Testing the real Astro build caught an ignored configuration callback that had omitted Tailwind and the commercial-release gate. Static supported configuration and the build integration tests now prove both the rejection and approved-build paths.

Viewport checks found real Home overflow at 320px and 768px. The hero grid's intrinsic sizing and oversized decorative orbit were corrected. All four required viewport widths then passed. Platform-dependent symbols were replaced with SVGs after screenshot inspection.

The distinct-model review used `gpt-6-astra`. It was an independent GPT-family review, not a cross-provider panel. Its material layout finding was fixed and reverified. The comment audit proposed no deletions or code changes. Browser-storage exception comments explain real platform behavior and remain.

## Deployment evidence

The cloud GitHub connection can push source but cannot directly update Pages settings. Its Pages settings request returned HTTP 403, `Resource not accessible by integration`. The publication workflow requests a repository-scoped Actions token with Pages permission and configures the existing selected Pages host through that supported route.

Check the actual GitHub Actions deployment result and Pages status before claiming publication. A workflow file or successful local build alone does not prove deployment. Outstanding full-launch requirements remain checklist items and do not block the owner-authorized public prelaunch.
