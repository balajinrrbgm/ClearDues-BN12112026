# ClearDues Pitch Deck Outline

Google Slides-ready outline. Upload `deck.pptx` to Google Drive and open it with Google Slides. The deck is a prototype status presentation; the UI panel on slide 4 is a schematic, not a captured live screenshot.

## Slide 1 - ClearDues

Evidence-backed invoice follow-up for independent exporters and freelancers.

**Speaker notes:** Start with the one-sentence value. This is a local prototype; provider integrations are implemented but not yet live-verified.

**Rubric:** Innovation, presentation.

## Slide 2 - The record is scattered

India's Delayed Payments 3.0 summary reports ₹7.34 lakh crore in delayed MSME receivables as of March 2024. Micro units can face delays up to three times those of larger firms. Freelancer survey findings are vendor-reported and should be treated as such.

**Speaker notes:** The numbers motivate the problem; they do not prove ClearDues has reduced delays.

**Rubric:** Potential impact.

## Slide 3 - One reviewable case

Invoice plus correspondence becomes a source-linked evidence trail, verified excerpts, visible gaps, and a neutral editable next-step starter.

**Speaker notes:** AI selects exact quotes; the server discards model-generated narrative. A person reviews the source before acting.

**Rubric:** Innovation, design.

## Slide 4 - The demo flow

Schematic of the local workbench: left, evidence and source IDs; right, review panel and human-confirmed Sandbox actions. The live browser workflow was tested locally in demo mode.

**Speaker notes:** Distinguish the verified local flow from provider calls that still need credentials.

**Rubric:** Design, presentation.

## Slide 5 - Why this is different

Not another generic reminder bot: the differentiator is a source-first packet that preserves exact excerpts and separates evidence from generated suggestions.

**Speaker notes:** Prior art includes collection automation and invoice tools. Novelty is conditional; the project does not claim to be first.

**Rubric:** Innovation.

## Slide 6 - PayPal and AI are central by design

PayPal Invoicing v2 Sandbox adapter: create draft, retrieve status, send only after confirmation. Optional AI provider selects source excerpts and suggests gaps. Neither service was live-tested in this environment.

**Speaker notes:** Do not imply a successful external call. The badges report configured state, not verified connectivity.

**Rubric:** Technological implementation.

## Slide 7 - Guardrails and quality

Sandbox-only host, server-side secrets, deterministic validation, exact quote checks, stable request IDs, local SQLite, eight tests, three consecutive green runs, zero audit findings in the recorded npm audit.

**Speaker notes:** The API is local and unauthenticated; it is not production-ready or intended for an untrusted network.

**Rubric:** Technological implementation, design.

## Slide 8 - What is verified, what remains

Verified locally: browser workflow, storage, exports, type-check, build, tests. Unverified: live PayPal, live AI, public hosting/repository, user outcomes. Official YouTube video is waived by the user but remains mandatory under the rules.

**Speaker notes:** Be candid about the current gate status.

**Rubric:** Presentation.

## Slide 9 - Next steps

Validate with independent workers using synthetic or consented test data; complete live Sandbox and AI checks; finish license and history scans; publish a public repository and a compliant demo video only if the user authorizes the video requirement.

**Speaker notes:** Invite judges to evaluate the prototype's evidence-first approach, not unmeasured impact claims.

**Rubric:** Potential impact, presentation.
