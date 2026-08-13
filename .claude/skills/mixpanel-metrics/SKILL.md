---
name: mixpanel-metrics
description: Complete Mixpanel analytics implementation — setup, tracking plans, cross-stack metrics, dashboards, identity, governance, and audits. Combines Mixpanel's official implementation guide with project-specific patterns for frontend + backend orchestration.
trigger: /mixpanel-metrics
---

# Mixpanel Analytics — Complete Implementation Skill

This skill covers the full Mixpanel lifecycle: from first event to production governance. It combines Mixpanel's official implementation methodology (modes, phases, identity, compliance) with project-specific patterns (cross-stack orchestration, dashboard recipes, frontend-vs-backend decision framework).

## Core Principles

1. **Never force a workflow.** The user may want to jump straight to adding a metric. Let them.
2. **Suggest, never push.** Recommend methods and placement with reasoning. Accept the user's choice.
3. **Respect autonomy.** If the user skips a decision point, move on. Do not revisit unless asked.
4. **Be concrete.** Every suggestion includes the exact file path, import line, and code to paste.
5. **Collect before coding.** Do not write Mixpanel code until you know: which mode, which platform, whether a CDP exists, whether EU/CA users exist, and what the Value Moment is.
6. **Cite docs.** When recommending a Mixpanel feature, point to the specific doc or reference file.

## Mode Selection — Ask First

Before doing anything, ask the user which mode fits:

> "What brings you here today?"
> 1. **Quick Start** — Get first events into Mixpanel in one session
> 2. **Full Implementation** — Build a complete, production-ready analytics setup
> 3. **Add Tracking** — Extend an existing implementation (single metric or bulk)
> 4. **Audit** — Review and diagnose an existing implementation
> 5. **Dashboard Setup** — Create Mixpanel boards to visualize existing metrics

State the selected mode and offer to switch at any point.

### Mode switching rules

- If Quick Start surfaces high identity complexity, consent risk, or CDP usage → offer to escalate to Full Implementation.
- If Full Implementation user says "can we just get something working first?" → offer Quick Start.
- If Add Tracking reveals fundamental issues (identity bugs, naming chaos) → recommend Audit first.
- Escalation is always an offer, never automatic. The user decides.

## Pre-Flight — Codebase Scan (run before any mode if codebase access exists)

Scan silently before asking questions:

```
grep -r "mixpanel-browser" apps/web/package.json 2>/dev/null
grep -r '"mixpanel"' apps/api/package.json 2>/dev/null
grep -r "MIXPANEL_TOKEN\|VITE_MIXPANEL_TOKEN" .env.example 2>/dev/null
find . -path "*/lib/analytics.ts" -name "analytics.ts" 2>/dev/null | head -5
```

Also scan:
- Route/page files, controllers, API endpoints → candidate events
- Database models or schema files → candidate properties
- Auth/session files → where to place identify/reset
- Existing analytics calls (GA4, Amplitude, Segment) → first-draft event names
- Package files → exact tech stack → SDK selection
- Environment config → where tokens go

Present assumptions to the user rather than asking from scratch. Only ask what the codebase cannot answer.

## Setup States

| State | Action |
|---|---|
| Nothing set up | Run setup from `frontend-setup.md` and/or `backend-setup.md` based on user choice |
| Frontend only | If user needs backend tracking, offer to add it. Otherwise proceed. |
| Backend only | If user needs frontend tracking, offer to add it. Otherwise proceed. |
| Both set up | Skip setup, proceed to selected mode |

## Mandatory Pre-Implementation Questions (one-way doors only)

These cause irreversible rework if wrong. Ask only what the codebase scan did not answer:

1. **Platform?** (web, iOS, Android, React Native, Flutter, server-side) — determines SDK
2. **CDP or warehouse?** (Segment, Rudderstack, mParticle, Snowflake, BigQuery) — if yes, skip SDK, route through integration
3. **EU or CA users?** — if yes, consent must gate SDK init
4. **Value Moment?** — the most important user action (can't track without knowing what to track)

## Frontend vs Backend Decision (optional — offer, do not force)

If the user has both SDKs set up and seems uncertain about where to place a metric, consult `frontend-vs-backend.md`. If the metric spans multiple sessions or actors, consult `cross-stack-patterns.md` for the five orchestration patterns:
1. Journey Duration — multi-day elapsed time
2. Per-Stage Milestones — frontend tracks entry, backend tracks completion
3. Form + Outcome — frontend tracks UX, backend tracks business result
4. Two-Actor Handoff — both actors track with shared entity ID
5. Feature Adoption — frontend tracks depth, backend tracks first-use

Present as a one-line suggestion with reasoning. If the user does not engage, pick the obvious choice and move on.

## Mode Detail Files

Each mode has its own file with the full workflow:

- `modes/quick-start.md` — 7-step compressed flow
- `modes/full-implementation.md` — 8 phases (Discovery → Governance)
- `modes/add-tracking.md` — Single metric and bulk metrics planning
- `modes/audit.md` — Diagnose and fix existing implementation

## Compliance and Privacy

Read `compliance.md` before any mode if EU/CA users exist or consent status is unknown. Key rule: if consent is required and status is unknown, delay tracking initialization.

## Identity Management

Read `identity-management.md` during implementation. Key calls:
- On signup: create user in DB → identify(user.id) → people.set() → track('sign_up_completed')
- On login: identify(user.id)
- On app re-open: identify(user.id) if already logged in
- On logout: reset()

## Reference Files

### Setup & Configuration
- `frontend-setup.md` — Browser SDK boilerplate (init, identify, wrapper)
- `backend-setup.md` — Node.js SDK boilerplate (wrapper, env config)

### Decision Making
- `frontend-vs-backend.md` — Where to place each metric
- `cross-stack-patterns.md` — 5 patterns for frontend + backend orchestration
- `metric-design-patterns.md` — Funnel, retention, engagement, adoption, time-to-value, operational

### Implementation
- `methods-reference.md` — All frontend + backend SDK methods
- `examples-frontend.md` — Concrete frontend code examples
- `examples-backend.md` — Concrete backend code examples
- `naming-conventions.md` — Event and property naming taxonomy

### Post-Implementation
- `dashboards-guide.md` — Dashboard recipes, report types, board organization
- `identity-management.md` — Identity flows, anonymous bridging, QA checklist
- `governance.md` — Lexicon, Data Standards, Event Approval, roles, quarterly review
- `compliance.md` — Consent gates, GDPR/CCPA, privacy rules
- `critical-rules.md` — Highest-stakes implementation decisions (get these wrong = data corruption)

## Official Mixpanel Documentation

- [JavaScript SDK](https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript)
- [Node.js SDK](https://docs.mixpanel.com/docs/tracking-methods/sdks/nodejs)
- [Identify users](https://docs.mixpanel.com/docs/quickstart/identify-users)
- [Group analytics](https://docs.mixpanel.com/docs/data-structure/group-analytics)
- [Data residency](https://docs.mixpanel.com/docs/privacy/eu-residency)
- [Privacy & compliance](https://docs.mixpanel.com/docs/privacy/overview)
- [Full JavaScript API reference](https://developer.mixpanel.com/reference/javascript)
- [Boards](https://docs.mixpanel.com/docs/boards)
- [Creating boards](https://docs.mixpanel.com/guides/guides-by-topic/core-reports/create-boards)

## Security Rules

- NEVER include real Mixpanel project tokens, API secrets, or any credentials in skill files.
- Always use placeholders (`<project-token>`) in boilerplate templates.
- Real tokens belong in `.env` files only (gitignored).
- The Mixpanel project token is a public identifier, not a secret. But always read from environment variables — never hardcode in source files.
