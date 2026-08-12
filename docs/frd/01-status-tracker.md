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

- Click a request card to navigate to `/requests/:id` (requirement detail page).
- Click "Send reminder" to trigger an email to the approver.
- Click "Message requester" (mobile) to open a message form.

---

## Layout variants

The dashboard has two layout variants. The code implements **Variant A** (card grid). The mock shows **Variant B** (sidebar detail view). Both are documented here.

### Variant A — Card grid (implemented)

**Route**: `/dashboard`

**Structure**: Full-width page with filter chips and a responsive card grid.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Page title | Heading (h1) | "Requirements" | Static | Read-only |
| Subtitle | Text | "Create a requirement, shortlist vendors, and dispatch invites." | Static | Read-only |
| New requirement button | Link + Button | "New requirement" with plus icon | Enabled | Navigates to `/requests/new` |
| Filter chips | Chip row | "All" plus one chip per stage with non-zero count | Toggle | Filters the card grid to the selected stage |
| Requirement cards | Responsive grid | 1 column (mobile), 2 columns (sm), 3 columns (lg) | Populated | Each card links to `/requests/:id` |

**Empty state**: A centered card with a plus icon, "No requirements yet", and a "New requirement" button.

**Error state**: A centered card with the error text and a "Try again" button.

**Loading state**: A centered spinner.

### Variant B — Sidebar detail view (mock, not yet implemented)

The mock (screens 1a, 1b) shows a different layout described below. When this variant is built, it will replace or supplement Variant A.

---

## Desktop layout — Variant B (Screen 1a)

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

## Mobile layout — Variant B (Screen 1b)

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

## Activity log

The main content area (Variant B) shows an activity log below the alert card.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Section heading | Heading (h3) | "Activity" | Static | Read-only |
| Activity item | List item | Timestamped event text | Static | Read-only |

Example items:
- "Finance approved -- Aug 8, 4:12 pm"
- "Submitted by Priya (Sourcing) -- Aug 1, 9:03 am"

Each item shows the event description and the date with time. Items appear in reverse chronological order. A dashed separator divides items.

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
| Send reminder | Click | Sends an email to the approver assigned to the active (overdue) step. Toast: "Reminder sent to {approver name}". The button is visible only when the active step is overdue. | Toast: "Failed to send reminder. Try again." |
| Search input | Keystroke | Request list filters in real time | No results message: "No requests match your search" |
| Filter tab: All | Click | Shows all requests | N/A |
| Filter tab: Needs my input | Click | Shows only requests that need the buyer's action | Empty list message: "No requests need your input" |
| Request card | Click | Navigates to `/requests/:id` (requirement detail page). In Variant B, loads the vendor detail in the main content panel. | Toast: "Failed to load request details" |
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
