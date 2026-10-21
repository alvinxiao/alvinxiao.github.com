# Review the design proposal

These screenshots show the built public prelaunch, not an approved business identity or completed commercial launch.

Contact screenshots show disabled inquiries without a contact address or provider endpoint. No prices or personal credentials are invented.

| Page | Desktop, 1440px | Mobile, 390px |
| --- | --- | --- |
| Home | [Desktop Home](home-desktop.png) | [Mobile Home](home-mobile.png) |
| Services | [Desktop Services](services-desktop.png) | [Mobile Services](services-mobile.png) |
| Contact | [Desktop Contact](contact-desktop.png) | [Mobile Contact](contact-mobile.png) |
| About | [Desktop About](about-desktop.png) | [Mobile About](about-mobile.png) |
| Resources | [Desktop Resources](resources-desktop.png) | [Mobile Resources](resources-mobile.png) |

The [320px Home screenshot](home-320.png) records the narrowest tested layout. Home, Services, and Contact also passed overflow checks at 768px.

The [public checklist screenshot](checklist-mobile.png) records the deferred full-launch reviews.

Owner visual approval remains required for typography, spacing, illustration style, colors, navigation, and responsive layout. See [the implementation review](../REVIEW.md) for the remaining content and release gates.

## Readability and motion update

The owner requested a 15px minimum text size and smoother movement. Captions and labels now use a shared 0.9375rem token, body text scales from 16px to 18px, and introductory text scales from 18px to 22px. Browser font preferences and zoom remain supported. The mobile illustration is resized through its geometry rather than shrinking its text.

Buttons, cards, arrows, and fields use coordinated easing. Page introductions and illustration notes enter with short staggered movements. Supporting browsers crossfade between pages. Reduced-motion mode disables these effects, and navigation remains functional without JavaScript.

## Identity, resources, and service update

The owner retained Practical AI temporarily, selected a plain wordmark and PA favicon, approved the concrete customer-question workflow, and supplied Alvin Xiao's biography. All service disclosures now start open and remain collapsible. Prices are omitted. Unanswered service policies and operational requirements remain deferred.

The three resource guides now include a fictional reminder-email exercise, an explanation of AI limitations, and a comparison of workflow options. Their coordinated artwork was generated for this site. The original three-panel PNG is in `src/assets/resource-illustrations.png`; Astro serves an optimized WebP, with each article showing its corresponding panel. The illustrations are decorative, with their meaning supplied by the adjacent article text. Final editorial review remains pending.

The [mobile article screenshot](article-mobile.png) records the illustrated first-experiment guide.

## Homepage visual polish

Every main-page section now includes an illustration or a meaningful line icon. A shared SVG component keeps the line weight and colors consistent across learning, conversation, workflow, implementation, and review symbols. The personal introduction reuses the generated magnifying-glass artwork, with no invented portrait or client logos. Icons are decorative and hidden from assistive technology; all meaning remains in visible text. Hover movement respects reduced-motion preferences.

## Workflow progression

The homepage workflow repeats a 10.8-second sequence, with 3.6 seconds per step. Card borders, progress lines, icons, and arrow handoffs advance together while the copy stays visible. A labelled checkbox pauses the full sequence without JavaScript. Reduced-motion preferences disable the animation and hide the unnecessary control. Browser checks cover the three phases, pause/resume, and reduced motion.

Review frames: [question](workflow-step-1.png), [draft](workflow-step-2.png), and [human review](workflow-step-3.png). These show an illustrative process, not an actual inquiry or message being sent.
