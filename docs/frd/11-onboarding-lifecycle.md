# FRD 11 — Onboarding Lifecycle

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/lifecycle` |
| Screens | 3a (desktop) |
| Role | Both (Buyer and Vendor can view) |

## Purpose

The screen shows the full onboarding journey across all three lanes (Buyer, Platform, Vendor) on one page.

## Entry points

- Click the "Lifecycle" tab from a request detail view.
- A direct URL or bookmark to `/requests/:id/lifecycle`.

## Exit points

- Click "Send reminder" to notify the party that owns the active step.
- Navigate away through the main sidebar or browser back button.

---

## Desktop layout (Screen 3a)

**Structure**: Main timeline (flex 1) + right sidebar (270 px fixed).

### Header

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Vendor name | Heading (h2) | "Acme Fasteners Inc. -- Onboarding" | Static | Read-only |
| Request info | Subtext (right-aligned) | "Request #VR-2291 . Day 9 of 14" | Static | Read-only |

### Lane key row

A horizontal row below the header. A dashed bottom border separates it from the timeline.

| Element | Type | Color | Label |
|---------|------|-------|-------|
| Buyer dot | Colored circle | Purple `#5b52d6` | "Buyer" |
| Platform dot | Colored circle | Brown `#8a6d3b` | "Platform" |
| Vendor dot | Colored circle | Teal `#1f8f6b` | "Vendor" |

The lane key is a legend only. It does not respond to clicks.

### Alert bar

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Alert container | Banner (amber bg `#fff3ea`) | "Currently: Vendor entering PAN/GSTIN . waiting on vendor . overdue by 3d vs SLA" | Visible when active step is overdue | Read-only |
| Send reminder | Button (dark, small) | "Send reminder" | Enabled | Sends a reminder to the party that owns the active step |

### Timeline

The timeline lists all steps grouped by section. Each step shows a colored circle (lane color), a title, a subtitle, and a lane badge tag.

**Intake & invite**

| Step | Lane | Title | Subtitle | State |
|------|------|-------|----------|-------|
| 1 | Buyer | Create requirement | Category and process | Done |
| 2 | Buyer | Select candidates | Directory or manual | Done |
| 3 | Buyer | Dispatch invites | Bulk to shortlist | Done |
| 4 | Platform | Issue magic links | Email and WhatsApp | Done |

**Verification**

| Step | Lane | Title | Subtitle | State |
|------|------|-------|----------|-------|
| 5 | Vendor | Enter PAN and GSTIN | Inline validation | Active |
| 6 | Platform | Auto-verify | PAN, GST, Udyam | Todo |
| 7 | Vendor | Answer and upload | Capability, documents | Todo |
| 8 | Buyer | Review and score | Verification chips | Todo |

**Award & full pack**

| Step | Lane | Title | Subtitle | State |
|------|------|-------|----------|-------|
| 9 | Buyer | Mark awarded | Full pack triggered | Todo |
| 10 | Vendor | Upload full pack | Bank, statutory, legal | Todo |
| 11 | Platform | Deep verification | Penny drop, filings | Todo |

**Approvals & contract**

| Step | Lane | Title | Subtitle | State |
|------|------|-------|----------|-------|
| 12 | Buyer | Quality / Finance / Tax | Internal, all clear | Todo |
| 13 | Vendor | Review & sign contract | Comment or agree | Todo |
| 14 | Platform | Push to SAP | Business Partner API | Todo |
| 15 | Buyer | Vendor code stored | Onboarding closed | Todo |

### Right sidebar

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Progress label | Heading (h3) | "Overall progress" | Static | Read-only |
| Progress bar | Bar | 22% filled (dark fill) | Derived | Read-only |
| Decision heading | Heading (h3) | "Decision points hit" | Static | Read-only |
| Decision 1 | Text line | "Invite opened? -- yes" | Static | Read-only |
| Decision 2 | Text line | "PAN already known? -- no" | Static | Read-only |
| Decision 3 | Text line | "All checks pass? -- pending" | Static | Read-only |
| Exit heading | Heading (h3) | "Exit paths so far" | Static | Read-only |
| Exit text | Text line | "None taken -- no expiry, rejection, or reopen yet" | Static | Read-only |

### Step state visuals

| State | Circle | Text | Description |
|-------|--------|------|-------------|
| Done | Filled circle, lane color background, white checkmark | Normal weight | The step is complete |
| Active | Empty circle, thick border in lane color | Bold | The step is in progress |
| Todo | Empty circle, opacity 0.55 | Normal weight | The step has not started |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String (format: `VR-NNNN`) | Auto-generated, unique | Yes |
| Vendor name | String | Max 200 characters | Yes |
| Current day | Integer | Derived from the request creation date | Yes |
| Target days | Integer | SLA target in calendar days | Yes |
| Overall progress | Integer (0--100) | Derived: (done steps / total steps) * 100 | Yes |
| Steps | Array of step objects | At least one step | Yes |

### Step object

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Step ID | String | Auto-generated | Yes |
| Lane | Enum: `buyer`, `platform`, `vendor` | Must be one of the three values | Yes |
| Title | String | Non-empty | Yes |
| Subtitle | String | Non-empty | Yes |
| Section | Enum: `intake-invite`, `verification`, `award-full-pack`, `approvals-contract` | Must be one of the four values | Yes |
| State | Enum: `done`, `active`, `todo` | Must be one of the three values | Yes |
| Completed at | ISO 8601 datetime | Valid datetime | No (set when state changes to done) |

### Decision point object

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Label | String | Non-empty | Yes |
| Answer | Enum: `yes`, `no`, `pending` | Must be one of the three values | Yes |

## Status / state mapping

| State value | Visual | Color / Style | Meaning |
|-------------|--------|---------------|---------|
| Done | Filled circle with white checkmark | Lane color background, white text | The step is complete |
| Active | Empty circle with thick border | Lane color border, bold text | The step is in progress |
| Todo | Empty circle | Opacity 0.55, normal text | The step has not started |
| Overdue | Amber background on alert bar | `#fff3ea` | The active step exceeded the SLA |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Send reminder | Click | Toast: "Reminder sent." | Toast: "Failed to send reminder." |
| Timeline step | Click | No action (read-only) | N/A |
| Lane key | Click | No action (legend only) | N/A |

## Business rules

1. The timeline shows all steps across all three lanes in one view.
2. Only one step can be active at a time.
3. The system calculates overall progress as (done steps / total steps) * 100.
4. The alert bar appears only when the active step is overdue.
5. The "Send reminder" button targets the party that owns the active step.
6. Decision points update automatically as the request moves through steps.
7. Exit paths show any early termination events (expiry, rejection, reopen).
8. The lane key row uses a dashed bottom border to separate it from the timeline.
9. Both the buyer and the vendor can view this screen. Neither can edit steps directly.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| All steps done | Hide the alert bar. Show 100% progress. Show "Onboarding complete" in the alert bar area. |
| No steps done | Show 0% progress. The first step is active. |
| Network error | Show toast: "Could not load lifecycle. Click to retry." |
| Loading state | Show skeleton for the timeline and the sidebar. |
| Request expired | Show a red banner: "This request expired on {date}." Dim all todo steps. |
| Request rejected | Show a red banner: "This request was rejected." Highlight the rejection step in red. |
