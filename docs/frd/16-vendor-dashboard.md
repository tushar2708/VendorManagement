# FRD 16 — Vendor Status Tracker (Vendor Dashboard)

## Page

| Field | Value |
|-------|-------|
| Route | `/vendor/dashboard` |
| Role | Vendor |

## Purpose

The vendor tracks their own onboarding progress. This screen is a derived design based on the buyer's status tracker (mock screen 1b). The mock does not define a separate vendor dashboard screen. The step names below ("Registration submitted", "Identity verified", etc.) are a reinterpretation of the buyer-side steps ("Submitted", "Finance", "Legal", etc.) for the vendor audience. Internal buyer approval steps are collapsed into one "Under review" step.

## Entry points

- The vendor logs in and lands here as the default page.
- The main navigation link "Dashboard" (vendor side).

## Exit points

- Click the action button on the current step to go to the relevant page (pre-qual, full-pack, or contract).
- Click "Message buyer" to open a message form.

---

## Mobile-first layout

**Structure**: Single column, full width. Works on desktop without changes.

### Component inventory

| Element | Type | Label | State | Behavior |
|---------|------|-------|-------|----------|
| Company name | Heading (h2) | Vendor company name (dynamic) | Static | Read-only |
| Request info | Subtext | "Request #VR-NNNN · Day X of typical 15-30" | Static | Read-only; values are dynamic |
| Alert card | Card (amber bg `#fff3ea`) | Overdue or action-needed message | Visible when a step needs vendor action or is overdue | Contains a call-to-action for the vendor |
| Step: Registration submitted | Step item | "Registration submitted" | Done / current / pending | Read-only |
| Step: Identity verified | Step item | "Identity verified (PAN/GSTIN)" | Done / current / pending | Read-only |
| Step: Documents uploaded | Step item | "Documents uploaded" | Done / current / pending | Read-only |
| Step: Under review | Step item | "Under review" | Done / current / pending | Read-only |
| Step: Contract signing | Step item | "Contract signing" | Done / current / pending | Read-only |
| Step: Onboarded | Step item | "Onboarded" | Done / current / pending | Read-only |
| Action button | Button (full width) | Context-specific label (see Actions table) | Enabled on the current step | Navigates to the relevant page for the current step |

### Vertical step list

Each step row has a circle indicator on the left and a label on the right. The circle and label styles depend on the step state.

| Step state | Circle style | Label style |
|------------|-------------|-------------|
| Done | Filled dark (`#1a1a1a`), 22 px | Normal weight (400) |
| Current | Red accent border (3 px solid `#d94f2b`), 22 px, white fill | Bold weight (700) |
| Pending | Empty circle, 2 px border `#1a1a1a`, 22 px, white fill | Normal weight (400) |

Steps connect with a vertical line. The line is dark for completed segments and gray for pending segments.

### Alert card

- Background: `#fff3ea`
- Shows when the current step needs vendor action or is overdue.
- Contains a bold title (e.g., "Action needed: Upload documents") and a description.
- Contains a call-to-action button when the vendor must act.

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String (format: `VR-NNNN`) | Must exist and belong to the vendor | Yes |
| Vendor company name | String | Max 200 characters | Yes |
| Current step | Enum: `registration`, `identity`, `documents`, `review`, `contract`, `onboarded` | Must match a step | Yes |
| Step start date | ISO 8601 date | Valid date | Yes (per step) |
| Day count | Integer | Calculated: current date minus request creation date | Derived |
| Step status | Enum: `done`, `current`, `pending` | One step must be `current` unless all are `done` | Yes (per step) |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Done | Dark filled circle (`#1a1a1a`) | The step is complete |
| Current | Red accent border (`#d94f2b`) | The step is active now |
| Pending | Gray empty circle | The step has not begun |
| Action needed | Amber card background (`#fff3ea`) | The vendor must act on the current step |
| Overdue | Red badge (`#d94f2b`) | The step exceeded its SLA |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Complete registration | Click (when current step = registration) | Navigates to pre-qual form | Toast: "Failed to load form" |
| Verify identity | Click (when current step = identity) | Navigates to PAN/GSTIN entry | Toast: "Failed to load form" |
| Upload documents | Click (when current step = documents) | Navigates to full-pack upload | Toast: "Failed to load upload page" |
| Sign contract | Click (when current step = contract) | Navigates to contract review page | Toast: "Failed to load contract" |
| Message requester | Click (always visible) | Opens a message form | Toast: "Failed to open message form" |

## Design decision: pipeline visibility

The mock (journey viewer, step 5 -- "Submitted -- status tracker") shows the vendor seeing the full 6-step buyer pipeline: Submitted, Finance, Legal, IT/Sec, Quality, Activated.

This FRD deliberately collapses those internal buyer steps into one "Under review" step.

**Rationale**:

- Individual approver names (Finance, Legal, IT/Security, Quality) are internal to the buyer organization.
- SLA durations per approver are buyer-confidential data.
- Exposing internal steps would set false expectations when a single approver is slow.
- The vendor needs only two facts: "your submission is under review" and "action is needed from you."

The vendor dashboard uses these six steps instead: Registration submitted, Identity verified, Documents uploaded, Under review, Contract signing, Onboarded. This mapping hides buyer-side structure while preserving progress transparency.

---

## Business rules

1. Show only the vendor's own onboarding requests. Do not show other vendors' data.
2. Collapse the internal buyer steps (Finance, Legal, IT, Quality) into one step called "Under review."
3. Do not show individual approver names or SLA details to the vendor.
4. Show the alert card when the current step needs vendor action.
5. Show a context-specific action button that matches the current step.
6. Calculate the day count from the request creation date.
7. Show "Day X of typical 15-30" to set expectations for the vendor.
8. When all steps are done, redirect to the onboarding complete screen (`/vendor/complete`).

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No onboarding requests exist | Show an empty state: "No onboarding requests. You will see your progress here after a buyer invites you." |
| All steps are done | Redirect to `/vendor/complete`. |
| Current step is "Under review" | Show message: "The buyer team is reviewing your submission. No action is needed from you." Hide the action button. |
| Network error on load | Show a retry message: "Could not load your dashboard. Click to retry." |
| Loading state | Show skeleton step list and skeleton header. |
| Multiple onboarding requests | Show a list of request cards. The vendor selects one to see its step progress. |
| Vendor revisits after onboarding is complete | Show the completed step list with all steps marked done, plus a link to the complete screen. |
