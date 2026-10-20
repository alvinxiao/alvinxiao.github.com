# Product and functional specification

## Product mission
Build a polished, approachable, personal website for a solo AI education and automation consultant. It helps nontechnical small-business owners and independent professionals understand available services and submit qualified inquiries. The consulting practice is generalist, industry-agnostic, education/advice-first, with custom implementation secondary. The website is a pre-launch lead-generation site, **not** a booking or payment site.

## Goals and non-goals
**Goals:** explain the offering in plain language; help beginners and problem-holders find a service; establish credible, truthful personal expertise; collect usable inquiries with low friction; enable Codex-maintained content; operate within a $0/month hosting/form budget subject to free-tier limits.

**Non-goals:** scheduling, accepting payment, authentication, a custom CRM/database, AI chat widget, lead scoring, automatic advice, custom backend, complex animations, industry specialization, unverified testimonials or results, analytics at launch.

## Primary user journeys
1. **Beginner:** Home → 'I'm new to AI' → Getting Started service details → contact form preselected for learning → confirmed success page.
2. **Problem owner:** Home → 'I have a problem to solve' → Problem-Solving or Workflow Audit → contact form with relevant service → success page.
3. **Exploring visitor:** Home → examples/resources/About → Services → Contact.
4. **Failure:** Form validation or network/provider failure → entered data retained → retry with duplicate-submission precautions → visible email fallback.
5. **Owner:** Receive provider email notification → review provider dashboard/inbox → personally reply. No claim of durable CRM or automatic client acknowledgment at launch.

## Site map and routes
- `/` Home: hero, two paths, services preview, practical examples, process, personal introduction (only if approved), final CTA.
- `/services/` service comparison and progressively disclosed details; anchor targets for each service; clear inclusion/exclusion and provisional prices gated from publication.
- `/about/` user-approved biography and approach; do not publish an unfinished placeholder.
- `/resources/` resource index. Launch content may be minimal; planned articles: AI basics, getting started practically, one business workflow scenario. Publish only completed, useful articles.
- `/contact/` short adaptive form, privacy notice, fallback email.
- `/thank-you/` confirmation only after provider accepts submission; direct navigation must not falsely imply a submission occurred (use neutral messaging if accessed directly or route-state guard).
- `/privacy/` concise, accurate policy based on actual provider/configuration, retention and deletion process; approve before launch.
- Standard 404 and accessible site navigation/footer.

## Conversion and navigation
Primary hero CTA: **Tell me what you're working on** → `/contact/`.
Secondary hero CTA: **Explore services** → `/services/`.
Visitor paths: **I'm new to AI** and **I have a problem to solve**; these are helpful starting points, not mutually exclusive funnels. Each leads to relevant service content. Each service CTA: **Ask about this service** with a safely encoded preselection. Footer CTA: **Get in touch**. Never show 'Book now', 'Schedule a call', or imply payments or availability are live.

## Inquiry form functional contract
Required: name, email, interest/service category, short description of request. Optional: one contextual follow-up field determined by category; optional business context only if necessary. Interest options: learning, specific problem, workflow audit, implementation, other/not sure. A selected service from URL may prefill but must be editable. Single page, no upload, no budget requirement, no sensitive business records. Client-side validation plus provider-side validation where supported. Accessible labels, error summaries, visible progress state, keyboard and screen reader support.

Submit only once per deliberate attempt; disable submit while pending; avoid automatic blind retry; on recoverable error preserve input and provide retry and mailto fallback. After a confirmed success response, navigate to `/thank-you/`. Acknowledgment email is **not** included in free launch unless independently verified free and configured. Owner notification and provider storage are required and must be tested. Formspree Free retention is assumed limited and must be verified during setup. Do not claim permanent tracking.

## Privacy and operational rules
Minimize fields. Explicitly discourage passwords, client records, payment data, or other sensitive details. Publish an accurate privacy notice identifying the provider and purpose, storage/retention limits, deletion request route, and any applicable disclosures. Determine a repeatable process for deleting inquiries from provider storage and email. No secrets or private API keys in browser assets or repository. Avoid sending form contents to analytics or logging. No file uploads.

## Content requirements
Personal name + descriptor, warm first-person voice, no jargon, no em dashes in marketing copy. The user supplies and approves biography and factual claims. Explain when AI may not be necessary through realistic examples. Illustrative scenarios must be labeled as such; real personal projects must be accurate and approved. No invented clients, credentials, case studies, ROI, or guarantees.

## Service boundaries
Services are provisional until the user approves scope/prices: Getting Started (75-minute personalized education, one-page guide); Problem-Solving (60-minute or optional 90-minute advisory session, brief recap); Workflow Audit (one defined workflow, limited discovery and concise written assessment); Custom Automation (separately quoted, no promised integrations/timelines). One clarification email exchange within seven days is a proposed service policy, subject to approval. No production access or compliance audits promised.

## Quality and definition of done
All production pages complete and approved; no placeholders or unapproved prices; inquiry path tested end-to-end; manual release approval; automated build/tests pass; accessibility, performance and SEO requirements met as defined in `TESTING.md`; rollback plan documented; zero recurring platform charges under expected usage and confirmed free plan.
