# Add Tracking Mode

Extend an existing Mixpanel implementation with new events. Two sub-modes:

## Single Metric

The user describes one event or action.

### Step 1 — Identify the action
Ask (if not clear): "What user action or system event do you want to track?"

### Step 2 — Frontend vs backend
If both SDKs are set up and the user seems uncertain, consult `frontend-vs-backend.md`.
If the metric spans multiple sessions or actors, consult `cross-stack-patterns.md`.

Present a one-line suggestion with reasoning. If the user does not engage, pick the obvious choice.

### Step 3 — Select the method
Map the intent to a Mixpanel method (see `methods-reference.md`):

| User intent | Method |
|---|---|
| "user did X" | `track()` |
| "how long did X take" | `time_event()` + `track()` |
| "count lifetime X per user" | `people.increment()` |
| "store a fact about the user" | `people.set()` |
| "store a fact only once" | `people.set_once()` |
| "see metrics by org/team" | `set_group()` |
| "attach context to all events" | `register()` |
| "backfill past events" | `import()` (backend only) |
| "track revenue" | `people.track_charge()` |

Suggest with reasoning. Never push.

### Step 4 — Design the event
Propose: event name (follow `naming-conventions.md`), properties, file location. Ask to confirm.

### Step 5 — Generate code
Write the exact import + call. Show the file path and insertion point.

### Step 6 — Verify
Tell the user to check Mixpanel Live View.

## Bulk Metrics

The user says "add metrics for the whole onboarding flow" or "track everything on the buyer dashboard."

### Step 1 — Scope
Ask: "Which part of the product?" Options: Entire product, Buyer flows, Vendor flows, A specific page/feature.

### Step 2 — Read the code
Explore relevant source files. Identify every user action, state transition, API call, and form submission.

### Step 3 — Classify each event
For each candidate: frontend or backend, method, event name, properties, file location, category (funnel / engagement / retention / adoption / operational). See `metric-design-patterns.md`.

### Step 4 — Present the plan
Table: Event | Trigger | Side | Method | Properties | File | Category

Ask: "Review this plan. Remove any you do not want. Add any I missed. Rename anything."

### Step 5 — Generate all code
After confirmation, generate all changes. Show summary of files changed.

### Step 6 — Verify
List events and how to trigger each. Point to Live View.

### Step 7 — Document
Update Lexicon for all new events. See `governance.md`.

## Pre-implementation check for existing schema

Before designing new events, check what already exists:
- Query existing events in Mixpanel Lexicon
- Match established naming conventions
- Reuse existing property names where the same concept applies
- Do not create a new event if extending an existing one with a property suffices
