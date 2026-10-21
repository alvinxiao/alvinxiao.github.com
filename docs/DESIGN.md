# Design system specification

## Approved direction
**Friendly Technical + Modern Editorial**: approachable and professional, typography-led, playful only in small accents. Balanced visual personality; no childish aesthetic, corporate dashboard, neon circuitry, robots, AI brains, or generic stock photos.

## Starting color tokens (approved direction; exact contrast-adjusted variants require verification)
- Canvas `#F8F7F3`
- Ink `#24313B`
- Teal `#247E78`
- Peach `#F1B18C`
- Mist `#E5EFEC`
Use teal primarily for actions and accents, peach sparingly, and dark ink for primary text. Verify contrast for every foreground/background pair; change exact shades if necessary without changing overall direction. Do not assume white text on teal passes all text-size cases without testing.

## Typography
All sans-serif. Use a modern readable type family or system stack with a small, documented type scale. Specific font selection is delegated to Codex as a proposal, requiring owner visual approval. Optimize font loading and avoid excessive weights. Readable line length, strong hierarchy, generous whitespace, sentence-case headings.

## Layout
Responsive, content-first; mobile-first CSS; max content widths; accessible navigation. Strong hero with text first and modest custom geometric/process illustration. Two path cards prominent and equally weighted. Avoid wrapping every section in cards. Rounded but restrained components, subtle borders, occasional muted background panels. Clear CTAs, visible hover and keyboard focus states. Avoid layout shifts and excessive visual effects.

## Illustrations
One modest hero illustration; icons and diagrams only where explanatory. Workflow diagrams should be legible on mobile and provide accessible alternatives. No AI-generated visual required for implementation; Codex can use CSS/SVG geometry if accessible and appropriate. Avoid depicting real client projects without approval. User photo optional on About later; design must be complete without it, no generic silhouette or empty photo placeholder in production.

## Motion
Subtle hover/focus transitions; no scroll hijacking or animation essential to comprehension. Respect `prefers-reduced-motion`. Ensure form validation and interactive states are not conveyed by color alone.

## Required reusable patterns
Header/navigation, mobile menu, hero, CTA button/link, service summary, path card, example row, process steps, footer, form fields and errors, article layout, optional diagram wrapper, privacy notice. Component API and implementation details may be chosen by Codex within these rules.

## Review artifacts
Before full page implementation, produce static visual previews of homepage desktop/mobile, Services, and Contact. User approves typography, spacing, illustration style, and accessibility-adjusted colors. No generic template substitutions without review.
