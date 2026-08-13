# Metric Design Patterns

Use these patterns when helping the user plan bulk metrics or when they ask "what should I track?"

## 1. Funnel analysis

A funnel is an ordered sequence of events toward a goal. Each step is a `track()` call. Mixpanel counts how many users reach each step and where they drop off.

**Example — vendor onboarding funnel:**
```
invite_opened → prequal_submitted → prequal_cleared → vendor_awarded →
full_pack_submitted → governance_cleared → contracts_executed → erp_pushed
```

**Rules:**
- Each step must be a separate event (not a property on a single event).
- The events must share a common identifier (e.g., `requestId`) so Mixpanel can connect them.
- Order matters — define the steps in the sequence you expect users to follow.

## 2. Engagement metrics

Engagement events are repeated actions that signal the user finds value. Track actions the user does more than once.

**Examples:**
- `requirement_created` (buyer creates a new request)
- `candidate_shortlisted` (buyer adds a vendor)
- `document_uploaded` (vendor uploads a file)
- `control_decided` (buyer makes a governance decision)

**How to measure:**
- Count events per user per week/month.
- Use `people.increment()` for lifetime counters.
- Build a Mixpanel report: "users who did X at least N times in the last 7 days."

## 3. Retention signals

Retention = the user came back. Track events that only happen when a user returns after their first session.

**Examples:**
- `dashboard_viewed` (buyer returns to check status)
- `vendor_status_checked` (vendor returns to see progress)
- `approval_decided` (approver returns to clear a control)

**How to measure:**
- Mixpanel Retention report: "users who did X on day 0, then did Y on day N."
- The "return" event should be something the user does voluntarily, not an automatic page load.

## 4. Feature adoption

Track first-use vs repeated-use of a feature to measure adoption.

**Pattern:**
- `people.set_once({ first_used_scoring: new Date().toISOString() })` — marks first use.
- `track("scoring_weights_adjusted")` — tracks repeated use.

**Examples:**
- Scoring weights adjusted (buyer uses the AwardThreePane)
- SLA rules configured (buyer sets custom thresholds)
- Governance controls reviewed (buyer uses the control panel)
- Contract redline added (either side adds a comment)

**How to measure:**
- Cohort: users with `first_used_scoring` set vs those without.
- Frequency: how often do adopters use the feature per week?

## 5. Time-to-value

Measure the time between a starting event and the user's first "value moment."

**Examples:**
- Signup → first requirement created
- Invite sent → vendor prequal submitted
- Award → contracts all executed
- Full lifecycle: requirement created → ERP pushed (total onboarding days)

**How to track:**
- Frontend: `time_event("first_requirement_created")` on signup, then `track("first_requirement_created")` when it happens. Mixpanel attaches `$duration`.
- Backend: compute the time difference and include it as a property: `totalDays: Math.floor((now - createdAt) / 86_400_000)`.

## 6. Operational metrics

System health events. These are almost always backend-tracked.

**Examples:**
- `verification_check_failed` — a prequal check returned FAIL
- `erp_push_failed` — the ERP sync failed
- `email_send_failed` — Resend returned an error
- `invite_expired` — a magic link was opened after expiry

**Properties to include:**
- `error_type`, `error_message` (sanitized, no PII)
- `latency_ms` (how long the operation took)
- `retry_count` (if applicable)

## How to present these to the user

When doing bulk metrics planning (Step 3 in SKILL.md), group the proposed events by pattern:

```
FUNNEL EVENTS (8)
  invite_opened, prequal_submitted, prequal_cleared, ...

ENGAGEMENT EVENTS (5)
  requirement_created, candidate_shortlisted, ...

RETENTION SIGNALS (3)
  dashboard_viewed, vendor_status_checked, ...

FEATURE ADOPTION (4)
  scoring_weights_adjusted, sla_rules_configured, ...

OPERATIONAL (3)
  verification_check_failed, erp_push_failed, ...
```

This helps the user see the coverage and gaps at a glance.
