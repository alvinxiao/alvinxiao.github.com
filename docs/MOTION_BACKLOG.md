# Motion audit and backlog

This pass identifies future animation work for Practical AI. It changes documentation and tracking only. The intended result is a site that feels more responsive and easier to follow while keeping the existing copy readable.

## Review method and limits

The review inspected the current page templates, shared CSS, navigation behavior, and workflow animation tests. A separate read-only reviewer checked the running prelaunch at Home, Services, About, Resources, an article, and Contact. All six surfaces returned prelaunch pages. Runtime inspection found ongoing animation in the Home workflow; other pages primarily animate introductory headings. These are local observations of the repository implementation, not a claim that every deployed interaction was checked.

The network proxy returned a CONNECT 403 for `astro.build/themes/`. The inspiration review therefore used Astro's [public theme catalogue source](https://github.com/withastro/astro.build/blob/main/src/content/themes/themes.json) and the themes' open-source implementations. The catalogue contains Astroship, ScrewFast, and AstroNano. No theme demo was visually reviewed, and no theme performance score was reproduced.

Throughput checkpoint: read-only site and theme review delegated separately from documentation and issue tracking. No runtime implementation is part of this pass.

## What already works

- Introductory Home, page, and article content has staggered entrances.
- Supporting browsers receive native cross-document page fades. This is progressive enhancement, not a client-side router.
- Buttons, links, fields, and homepage icon tiles already provide local feedback.
- The example workflow advances through three stages over 10.8 seconds, with a CSS-only pause control and a static reduced-motion version.
- All eight service disclosures start open. Navigation and disclosure content remain usable without JavaScript.
- The workflow uses the restored thin outline. The stronger outline was explicitly reverted and is not proposed again.

## Where more motion would help

Lower Home sections remain static while scrolling. Resource artwork has no coordinated card interaction. Service disclosures change instantly, and anchor destinations have little confirmation. The mobile menu has an entrance but closes through an immediate `display: none` change. About has few visual accents beyond its heading entrance. The workflow continues playing offscreen. Contact already has validation and pending states; any further form feedback must preserve their meaning and the prelaunch submission lock.

## Astro theme inspiration

| Reference                                                | Inspected evidence                                                                                                                                                                                                                                                                                                                                   | Adaptation for Practical AI                                                                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AstroNano](https://github.com/markhorn-dev/astro-nano)  | [ArrowCard](https://github.com/markhorn-dev/astro-nano/blob/main/src/components/ArrowCard.astro) uses 300ms color and arrow-transform transitions.                                                                                                                                                                                                   | Coordinate artwork, card depth, and existing arrow feedback, with equivalent keyboard emphasis.                                                                           |
| [Astroship](https://github.com/surjithctly/astroship)    | [Feature sections](https://github.com/surjithctly/astroship/blob/main/src/components/features.astro) group icons with text. Its [blog](https://github.com/surjithctly/astroship/blob/main/src/pages/blog.astro) pairs image and editorial content.                                                                                                   | Reveal coherent groups and preserve stable image frames. These files provide layout inspiration, not proof of an existing scroll animation.                               |
| [ScrewFast](https://github.com/mearashadowfax/ScrewFast) | [ProductDetail](https://github.com/mearashadowfax/ScrewFast/blob/main/src/components/sections/products/ProductDetail.astro) coordinates panel opacity and translation. [InsightDetail](https://github.com/mearashadowfax/ScrewFast/blob/main/src/components/sections/insights/InsightDetail.astro) uses GSAP ScrollTrigger for editorial navigation. | Borrow the idea of short, coordinated transitions. Keep native scrolling and local CSS; do not import its scroll pinning, GSAP setup, or navigation machinery by default. |

These are references, not a proposal to replace the current theme or copy third-party branding and assets. The proposed effects have not yet been prototyped or performance-tested.

## Prioritized issues

| Item      | Priority | Proposal                                                   | Tracking                                                               |
| --------- | -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| MOTION-01 | P1       | Reveal lower-page content in restrained groups             | [Issue #2](https://github.com/alvinxiao/alvinxiao.github.com/issues/2) |
| MOTION-02 | P1       | Give resource artwork coordinated hover and focus feedback | [Issue #3](https://github.com/alvinxiao/alvinxiao.github.com/issues/3) |
| MOTION-03 | P1       | Animate service disclosure open and close feedback         | [Issue #4](https://github.com/alvinxiao/alvinxiao.github.com/issues/4) |
| MOTION-04 | P1       | Emphasize the destination after service anchor navigation  | [Issue #5](https://github.com/alvinxiao/alvinxiao.github.com/issues/5) |
| MOTION-05 | P2       | Give the mobile menu a matched entrance and exit           | [Issue #6](https://github.com/alvinxiao/alvinxiao.github.com/issues/6) |
| MOTION-06 | P2       | Add one editorial motion accent to the About page          | [Issue #7](https://github.com/alvinxiao/alvinxiao.github.com/issues/7) |
| MOTION-07 | P2       | Pause the existing workflow when it is out of view         | [Issue #8](https://github.com/alvinxiao/alvinxiao.github.com/issues/8) |
| MOTION-08 | P3       | Add truthful form-state microfeedback                      | [Issue #9](https://github.com/alvinxiao/alvinxiao.github.com/issues/9) |

## Suggested sequence and PR boundaries

Start with MOTION-01 and compare two restrained group-reveal treatments before selecting one. Use its motion and fallback conventions for later work. MOTION-02, MOTION-03, and MOTION-04 can then ship independently. Follow with navigation and About refinements. MOTION-07 is a lifecycle improvement to an already working animation, not a prerequisite for the visual work. MOTION-08 stays deferred until inquiry activation and provider verification are ready.

Use one focused PR per issue by default. Each PR links its issue, describes visible behavior, and includes normal-motion and reduced-motion evidence. Separate documentation or prerequisites are also PRs. Auto-merge is allowed after checks pass and findings are resolved under the existing prelaunch authorization. No direct commits or pushes to `master`.

## Acceptance criteria for every implementation

- Preserve the 15px minimum text size and layouts at 320, 390, 768, and 1440px.
- Keep navigation, reading, fragments, and service disclosures usable without JavaScript. Content must not depend on a successful observer callback to become available.
- Respect reduced-motion preferences, including changes during the visit. Avoid continuous decorative loops outside the existing pausable workflow.
- Keep all service disclosures open initially. Preserve the thin workflow outline and the user pause control.
- Preserve visible keyboard focus and predictable focus order. Closing a menu must immediately remove its links from keyboard interaction, even if a visual exit continues.
- Do not delay error announcements, focus, navigation, or user input for an animation. Never simulate inquiry success or activate the prelaunch form.
- Prefer opacity and transform changes over moving layout. Do not add scroll hijacking, cursor followers, word-by-word biography animation, or perpetual floating across every section.
- Prefer CSS and a small shared helper. Any new framework or dependency requires a concrete benefit and a bundle review.
- Before calling an implementation faster, compare equivalent builds and interactions. Record page weight and relevant performance checks; do not treat a theme's published scores as this site's results.
- Provide a short interaction recording, representative desktop/mobile screenshots, keyboard and touch checks, and relevant browser assertions. Use actual builds and test normal, reduced-motion, script-failure, and no-JavaScript paths.

## Decisions and open work

Experience First shaped the priority order: improve reading flow and local feedback before adding more ambient movement. Prove It Works shaped the evidence rules: distinguish source inspection from browser observations and require real interaction evidence for future PRs.

Exact timing, stagger, illustration treatment, and supported-browser fallbacks remain implementation choices to prototype. No animation code, dependency, business fact, privacy setting, provider configuration, or commercial-launch approval changed in this review.
