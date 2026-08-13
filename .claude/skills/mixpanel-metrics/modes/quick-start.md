# Quick Start Mode

Get first events into Mixpanel in one session. Success criteria:
- Two events (`sign_up_completed` + Value Moment) are defined
- Tracking code is written and placed
- At least one event is confirmed in Live View
- Basic identity (identify on login, reset on logout) is wired in
- Any hard blockers (consent, CDP) have been surfaced

## What to require BEFORE implementation

- Platform confirmation (wrong SDK = rewrite)
- CDP/warehouse status (SDK when CDP exists = duplication)
- EU/CA consent status (events before consent = compliance violation)
- Value Moment identification
- Mini tracking plan for 2 events
- One valid project token

## What to defer to "next steps"

- Expanded tracking plan
- Full identity QA
- Dev/prod project split
- Analytics strategy and KPI framework
- Data governance
- Group Analytics

## Step 1 — Mandatory Questions

Ask only what the Pre-Flight codebase scan did not answer:

1. "What platform are you building on?" (determines SDK)
2. "Are you sending data through a CDP?" (Segment, Rudderstack, mParticle)
3. "Do you have users in the EU or California?" (consent gate)
4. "What's the most important action a user takes in your product?" (Value Moment)

## Step 2 — Context Gathering

Use whatever is available:
- **Codebase access** → Pre-Flight scan (highest value)
- **Company URL** → Light research: homepage + pricing. Cap at 3 pages, 2 minutes.
- **Neither** → Use the 4 questions above.

Present assumptions: "Based on what I found, here's what I'm working with: [platform], [tracking method], [Value Moment candidate]. Sound right?"

## Step 3 — Mini Tracking Plan (2 Events)

**Event 1: `sign_up_completed`**
- Trigger: User completes account creation (after DB write, after identify)
- Properties: sign_up_method, platform, referral_source

**Event 2: [Value Moment]**
- Trigger: [specific user action]
- Properties: [2-3 inferred from codebase or vertical]

Present both for confirmation.

## Step 4 — Project Setup

- Confirm one Mixpanel project with a token
- Store token in context
- Move on (dev/prod split is a follow-up)

## Step 5 — Codebase Access Check

> "Do you have access to the codebase, or are you gathering specs for a developer?"

If no codebase access: generate a Developer Handoff Spec and skip to Step 8.

## Step 6 — Implementation + Identity

Write real code placed in specific files:
1. SDK initialization (with real token)
2. Consent gate if EU/CA
3. `sign_up_completed` event call
4. Value Moment event call
5. Basic identity: identify on login/signup, reset on logout

Use boilerplate from `frontend-setup.md` and `backend-setup.md`.

Token injection: use the real token — never `YOUR_PROJECT_TOKEN` if the token is in hand.

### Identity (inline, not a separate phase)

```
On signup:  create user in DB → identify(user.id) → people.set() → track('sign_up_completed')
On login:   identify(user.id)
On logout:  reset()
```

After wiring, check for complexity signals (anonymous browsing, multi-device, shared devices, SSO). If present, offer a full identity QA pass — but do not gate progress on it.

## Step 7 — Verify in Live View

- Deploy to dev
- Open Mixpanel Live View
- Trigger both events
- Confirm they appear with correct properties

Do not proceed until at least one event is confirmed.

## Step 8 — Wrap-Up

Summarize what was shipped. Present prioritized next steps:
1. Add more events (→ Add Tracking mode)
2. Full identity QA (→ `identity-management.md`)
3. Dev/prod project split
4. Analytics strategy (RAE framework)
5. Data governance (→ `governance.md`)
6. Dashboards (→ `dashboards-guide.md`)
