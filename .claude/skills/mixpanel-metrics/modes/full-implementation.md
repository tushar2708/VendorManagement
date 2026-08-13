# Full Implementation Mode (Phases 0–7)

Run all 8 phases in order. Each phase gates the next. Ask questions conversationally (1-2 at a time).

## Context Block

Maintain and update after each phase:

- **Company name:**
- **Business model:** (SaaS / usage-based / transactional / freemium / marketplace)
- **Growth model:** (product-led / sales-led / marketing-led)
- **Customer type:** (B2B / B2C / B2B2C)
- **Stage:** (pre-PMF / growth / scale)
- **Platform(s):**
- **CDP in use:** (none / Segment / Rudderstack / mParticle)
- **Group Analytics:** yes / no
- **EU or CA users:** yes / no
- **Value Moment:**
- **KPIs (2-3):**
- **Dev project token:**
- **Prod project token:**
- **Tracking method:** server-side / client-side / CDP

## Phase 0 — Discovery

If Pre-Flight was run, skip platform and product type questions. Lead with assumptions.

1. Collect company name and URL.
2. Research: homepage + pricing + about page. Extract business model, growth model, customer type, stage, Value Moment candidate.
3. Present assumptions, then ask only what research could not answer: CDP status, Group Analytics, top business questions.

## Phase 1 — Analytics Strategy

1. "What does success look like in 90 days — acquisition, activation, engagement, or retention?"
2. "What is the single most important action that signals a user is getting real value?"

Name the Value Moment: `[Core Action] at [Natural Frequency]`. Apply 5M filter (Meaningful, Measurable, Manageable, Movable, Time-bound) to candidate KPIs.

## Phase 2 — Project Setup

1. Verify Simplified ID Merge is enabled (Project Settings → Identity Management → "Simplified API").
2. Create dev and production projects. Name clearly: `[Product] - Production` and `[Product] - Development`.
3. Set timezone (cannot change retroactively).
4. Collect both project tokens.
5. Assign roles: Owner, Admin, Analyst, Consumer.

For EU/CA users: flag for consent gate in Phase 6. Read `compliance.md`.

## Phase 3 — Data Model

Teach the user (if new to event-based analytics):
- **Events** — Immutable, timestamped actions.
- **Event Properties** — Point-in-time; never change after ingestion. Send numerics without quotes.
- **User Profiles** — Mutable, current state. Join retroactively via distinct_id.
- **Super Properties** — Auto-attached to every event. Use for: app_version, platform, plan_type.

If Group Analytics confirmed: surface set_group() and Group Profiles.

## Phase 4 — Tracking Plan

Start with exactly two events:
1. `sign_up_completed` (sign_up_method, referral_source, platform)
2. Value Moment event from Phase 1

Then expand using the 7-step sequence:
1. Define KPIs → Phase 1 output
2. Map KPIs to flows → user journeys
3. Flows → events → discrete actions
4. Events → properties → context per action
5. Identify globals → super properties
6. Identify profiles → user properties
7. Document → tracking plan before code

Follow naming rules from `naming-conventions.md`. Use vertical-specific event templates (SaaS, E-Commerce, Media, Fintech) if applicable.

The tracking plan must be reviewed before implementation begins.

## Phase 5 — Codebase Access Check

> "Do you have access to the codebase, or are you gathering specs?"

If no access: generate Developer Handoff Spec, skip to Phase 8.

## Phase 6 — Implementation

Decision gate:
- CDP → use integration, no SDK
- EU/CA → consent gate first (see `compliance.md`)
- Otherwise: ask server vs client vs both (or infer from codebase)

Use the relevant SDK from `frontend-setup.md` or `backend-setup.md`. For cross-stack metrics, see `cross-stack-patterns.md`.

Token injection: use real tokens, not placeholders.

QA gate: deploy to dev, open Live View, confirm at least one event appears.

## Phase 7 — Identity Management

See `identity-management.md` for full flows. Key calls:
- On signup: create user → identify(user.id) → people.set() → track('sign_up_completed')
- On login: identify(user.id)
- On app re-open: identify(user.id)
- On logout: reset()

Run the ID Management QA checklist before production.

## Phase 8 — Data Governance

See `governance.md`. Key steps:
1. Set up Lexicon for all shipped events.
2. Enable Data Standards (enforce snake_case).
3. Enable Event Approval (pending queue for unreviewed events).
4. Assign governance roles.
5. Schedule quarterly review.

## Phase Exit Checklists

| Phase | Gate |
|---|---|
| 0 | Business model confirmed, CDP/Group Analytics/platform captured |
| 1 | Named Value Moment + 2-3 KPIs |
| 2 | Simplified ID Merge verified, dev+prod projects, tokens stored |
| 3 | User understands events vs properties vs profiles |
| 4 | Tracking plan reviewed with at minimum 2 events fully specified |
| 6 | At least one event in Live View |
| 7 | ID Management QA passed in dev |
| 8 | Lexicon populated, Data Standards enabled, roles assigned |
