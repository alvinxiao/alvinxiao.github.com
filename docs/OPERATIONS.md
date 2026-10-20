# Develop and release the consulting site

## Start a local review

Use the existing checkout. Each cloud task is already isolated. Do not create a Git worktree unless the owner requests one.

1. Activate the Node version pinned in `.node-version`.
2. Run `npm ci` in the repository root.
3. Run `npm run dev -- --host 0.0.0.0` for development.
4. For a built review, run `npm run build:preview`, then `npm run preview -- --host 0.0.0.0`.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e` before review.

Local preview output is for review. For the owner-authorized public prelaunch, run `npm run build:prelaunch`. Its separate output guard requires a public prelaunch label, a launch checklist, and disabled inquiries. Browser tests intercept provider requests with synthetic data. Passing them does not verify Formspree storage or notification delivery.

## Preserve the historical site

The old website remains on local branch `work`, commit `8562cb1b45ca1645918d71465fbe2f26397c08a6`. The specification base is `dd06e700a03ea1d2ac06f5a6b7f69529e8c7c4dc`.

Before implementation, all local refs and history were saved to `/workspace/preservation/consulting-before-implementation.bundle`. The bundle was verified and restored as a disposable bare repository. The legacy `index.html` object was confirmed and `git fsck --full` passed. There were no untracked or ignored files before the branch change.

Keep a verified copy outside the ephemeral cloud environment before retiring the legacy site. A Git bundle does not preserve Firebase data, external embeds, account settings, or the previously deployed Pages artifact. Do not reactivate historical scripts that write to Firebase as a preservation test.

## Complete owner approvals

Record exact approved identity, biography, public contact, service terms, privacy copy, design, and provider configuration in the site's centralized content. Do not infer approval from a code review or successful tests. Keep the private notification destination in the provider dashboard, not public site configuration.

Obtain explicit decisions on legacy URLs, repository identity, and deployment policy. The actual repository is `alvinxiao/alvinxiao.github.com`. The architecture document's `.github.io` repository name is a known discrepancy. Do not rename or move the repository to resolve it automatically.

## Verify Formspree before release

The owner creates and configures the selected free account. No paid account or alternative provider is authorized.

1. Record the current official plan terms and verification date, including quota, retention, notification recipients, spam controls, AJAX/CORS behavior, attribution, and deletion capabilities.
2. Compare the quota with the owner's expected inquiry volume. Agree on monitoring and an overflow process. Escalate if the required workflow cannot remain free.
3. Configure the public endpoint and verified notification address. The endpoint identifier is public. Never add a private API token to the browser or repository.
4. Review and approve privacy text against actual provider settings and the deletion procedure.
5. In an owner-approved staging context, submit a clearly marked test inquiry with synthetic data.
6. Verify the provider dashboard record and delivery to the actual notification inbox separately. An accepted HTTP response does not prove email delivery.
7. Verify the service/category/context mapping and spam settings. Exercise rejection and recovery without losing entered data.
8. Delete the test record from provider storage and email copies, including trash where applicable. Record the actions without retaining inquiry contents in logs.
9. Document who handles deletion requests, which inbox copies and provider records are covered, and the confirmed retention limits. Do not promise a response time or retention duration until the owner approves it.

There is no promise of automatic visitor acknowledgment or a durable CRM. The current provider terms could not be retrieved from this environment, so no quota or retention duration is asserted here.

## Publish incremental prelaunch updates

The owner has authorized publishing progress even while commercial production gates remain open. The standing directive is recorded in `AGENTS.md`. Track remaining decisions in `PRODUCTION_CHECKLIST.md` and the public `/launch-checklist/` page.

`.github/workflows/publish-prelaunch.yml` builds and publishes a labelled prelaunch from `master` using GitHub Pages Actions. It runs quality checks and the actual build-gate integration tests before uploading `npm run build:prelaunch` output. It does not run the fully approved commercial-launch build.

The prelaunch mode ignores public email/endpoint environment overrides, disables inquiry submission, and disallows indexing. It must not pretend provider setup, business facts, or full-launch approvals are complete. Publish routine prelaunch improvements under the owner's standing authorization.

The original M0 observation was legacy Pages publishing directly from `master`, with HTTPS enforcement disabled. The prelaunch publication work migrates that selected host to Pages Actions. Verify the actual Pages settings and deployment result rather than assuming the workflow file alone enables it.

## Complete the commercial launch checklist

The public prelaunch is not a completed commercial launch. Before enabling inquiries or removing the prelaunch label:

1. Complete `PRODUCTION_CHECKLIST.md` using real owner approvals and provider evidence.
2. Verify the Pages host, DNS, HTTPS, redirects, branch protections, and release permissions.
3. Make the fully approved `npm run build` succeed with actual approved configuration. Do not change approval flags merely to make the build pass.
4. Complete manual accessibility, provider notification/storage/deletion, content, visual, SEO, and final Lighthouse checks.
5. Rehearse rollback and obtain the owner's exact full-launch approval.
6. Update publication mode deliberately and verify the live inquiry path afterward.

## Roll back an authorized release

Before deployment, retain the previous deployable artifact, source SHA, and a record of Pages settings. Restore it in a nonproduction environment first. A failed rehearsal blocks release.

On an owner-authorized rollback, redeploy the known-good artifact using the approved release procedure. Verify HTTPS, Home, every required route, assets, and form configuration. Restore hosting settings only if the rollback requires it and the owner approves it.

Reverting to the specification-only commit restores the pre-implementation repository state, not the historical site. Restoring the legacy SHA revives historical files and potentially unsafe external integrations. Choose the intended rollback target explicitly. Do not force-push shared history.
