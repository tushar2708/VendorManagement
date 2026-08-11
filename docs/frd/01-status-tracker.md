# FRD 01 — Onboarding Status Tracker

## Page

| Field | Value |
|-------|-------|
| Route | `/dashboard` |
| Screens | 1a (desktop), 1b (mobile) |
| Role | Buyer |

## Purpose

The buyer tracks vendor onboarding requests and their approval pipeline status.

## Entry points

- The main navigation sidebar link "Dashboard".
- A direct URL or bookmark to `/dashboard`.

## Exit points

- Click a request card to open the vendor detail view.
- Click "Send reminder" to trigger an email to the approver.
- Click "Message requester" (mobile) to open a message form.

---

## Desktop layout (Screen 1a)

**Structure**: Left sidebar (220 px fixed) + main content (flex 1).

### Left sidebar

| Element | Type | Label / Placeholder | State | Behavior |
|---------|------|---------------------|-------|----------|
| Search input | Text input | "Search requests..." | Empty by default | Filters the request list on each keystroke |
| Filter tab: All | Tab button | "All" | Selected (dark background) | Shows all requests |
| Filter tab: Needs my input | Tab button | "Needs my input" | Unselected | Shows only requests that need the buyer's action |
| Request card 1 | Card | "Acme Fasteners -- active" | Selected (amber background) | Loads the vendor detail in main content |
| Request card 2 | Card | "Bolt & Co (indirect) -- active" | Unselected | Loads the vendor detail in main content |
| Request card 3 | Card | "Zenith Tooling -- done" | Unselected | Loads the vendor detail in main content |
| Request card 4 | Card | "Harbor Logistics -- active" | Unselected | Loads the vendor detail in main content |

### Header bar

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Breadcrumb | Text | "My Requests › Acme Fasteners Inc." | Static | Read-only |
| User badge | Badge | "👤 Priya · Sourcing" | Static | Read-only |

### Main content

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Vendor name | Heading (h2) | "Acme Fasteners Inc." | Static | Read-only |
| Category badge | Badge | "Production-part supplier" | Red border | Read-only |
| Request info | Subtext | "Request #VR-2291 . Opened Aug 1 (9 days ago)" | Static | Read-only |
| Pipeline stepper | Horizontal stepper | 6 steps (see below) | Mixed | Read-only |
| Alert card | Card (amber bg `#fff3ea`) | "Waiting on: Legal -- Jane R. . in queue 6 days (SLA 3 days)" | Visible when a step is overdue | Contains overdue badge and reminder button |
| Overdue badge | Badge | "Overdue 3d" | Red, warning icon | Read-only |
| Send reminder button | Button (dark) | "Send reminder" | Enabled | Sends an email reminder to the approver |
| Activity item 1 | List item | "Finance approved -- Aug 8, 4:12 pm" | Static | Read-only |
| Activity item 2 | List item | "Submitted by Priya (Sourcing) -- Aug 1, 9:03 am" | Static | Read-only |

### Pipeline stepper steps

| Step | Label | Sub-label | Done icon | State |
|------|-------|-----------|-----------|-------|
| 1 | Submitted | — | Checkmark | Done (dark filled) |
| 2 | Finance | "2d" | Checkmark | Done (dark filled) |
| 3 | Legal | "6d — here now" | None | In progress (red accent border `#d94f2b`) |
| 4 | IT/Sec | — | None | Not started (gray) |
| 5 | Quality | — | None | Not started (gray) |
| 6 | Activated | — | None | Not started (gray) |

**Legend**: filled circle = done, filled circle with accent = in progress, empty circle = not started. Lines between steps are dark for done segments and gray for pending segments.

---

## Mobile layout (Screen 1b)

**Structure**: Single column, full width.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Back arrow | Icon button | Left arrow | Enabled | Returns to the request list |
| Vendor name | Heading | Vendor name text | Static | Read-only |
| Request info | Subtext | "Request #VR-2291 . Day 9 of typical 15--30" | Static | Read-only |
| Alert card | Card (amber bg) | Overdue message | Visible when overdue | Contains overdue badge and reminder button |
| Overdue badge | Badge | "Overdue 3d" | Red | Read-only |
| Send reminder button | Button (dark) | "Send reminder" | Enabled | Sends an email reminder |
| Vertical step list | Step list | Same 6 steps as desktop | Mixed | Read-only, vertical layout |
| Message requester button | Button (full width) | "Message requester" | Enabled | Opens a message form to the requester |

### Vertical step list (mobile)

| Step | Label | Visual |
|------|-------|--------|
| Submitted | "Submitted" | Filled circle |
| Finance | "Finance" with checkmark | Filled circle |
| Legal | "Legal (now)" | Red border, bold text |
| IT/Security | "IT/Security" | Empty circle |
| Quality | "Quality" | Empty circle |
| Activated | "Activated" | Empty circle |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String (format: `VR-NNNN`) | Auto-generated, unique | Yes |
| Vendor name | String | Max 200 characters | Yes |
| Vendor category | Enum: `production-part`, `indirect-services` | Must be one of the two values | Yes |
| Request status | Enum: `active`, `done` | Must be one of the two values | Yes |
| Opened date | ISO 8601 date | Valid date, not in the future | Yes |
| Current step | Enum: `submitted`, `finance`, `legal`, `it-security`, `quality`, `activated` | Must match a pipeline step | Yes |
| Assigned approver | String | Valid user reference | Yes (for the active step) |
| Days in queue | Integer | Calculated: current date minus step start date | Derived |
| SLA days | Integer | Positive integer, set per step | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Done | Dark filled circle | The step is complete |
| In progress | Red accent border | The step is active now |
| Not started | Gray empty circle | The step has not begun |
| Overdue | Red badge (`#d94f2b`) | The step exceeded its SLA |
| Active | Amber card background (`#fff3ea`) | The request needs attention |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Send reminder | Click | Toast: "Reminder sent to {approver name}" | Toast: "Failed to send reminder. Try again." |
| Search input | Keystroke | Request list filters in real time | No results message: "No requests match your search" |
| Filter tab: All | Click | Shows all requests | N/A |
| Filter tab: Needs my input | Click | Shows only requests that need the buyer's action | Empty list message: "No requests need your input" |
| Request card | Click | Loads the vendor detail in main content | Toast: "Failed to load request details" |
| Back arrow (mobile) | Click | Returns to the request list | N/A |
| Message requester (mobile) | Click | Opens a message form | Toast: "Failed to open message form" |

## Business rules

1. Calculate "days in queue" as the number of calendar days from the step start date to today.
2. Flag a step as "at risk" when the days in queue equal the SLA days minus 1.
3. Flag a step as "overdue" when the days in queue exceed the SLA days.
4. Show the alert card only when the active step is overdue.
5. Show the overdue badge text as "Overdue {N}d" where N = days in queue minus SLA days.
6. Sort the request list by status: active requests first, then done requests.
7. The "Needs my input" filter shows only requests where the current step is assigned to the buyer.
8. The pipeline stepper shows all 6 steps for all vendor types. The "Quality" step routing rule is defined on the intake form (screen 1e), not on this screen.
9. Calculate "Day X of typical 15--30" on mobile from the opened date.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No requests exist | Show an empty state: "No onboarding requests yet. Create your first request." |
| Search returns no results | Show: "No requests match your search." |
| All steps are done | Show the request card with status "done". The pipeline shows all steps as filled. |
| Network error on load | Show a retry message: "Could not load requests. Click to retry." |
| Loading state | Show skeleton cards in the sidebar and a skeleton stepper in the main content. |
| Overdue by 0 days (exactly at SLA) | Do not show overdue. Show "at risk" instead. |
