# FRD 03 — New Vendor Intake Form

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/new` (Variant A), `/vendors/new` (Variant B, proposed) |
| Screens | 1e (desktop), 1f (mobile) |
| Role | Buyer |

## Purpose

The buyer creates a new vendor onboarding request. Two variants exist.

- **Variant A (implemented)** — A requirement creation form at `/requests/new`. The buyer defines the part, process, and plant before shortlisting vendors.
- **Variant B (mock screens 1e/1f)** — A vendor onboarding intake form with a 3-step wizard. This variant is not yet implemented.

## Entry points

- The "New requirement" button on the dashboard (`/dashboard`).
- A direct URL or bookmark to `/requests/new` (Variant A) or `/vendors/new` (Variant B).

## Exit points

- **Variant A**: Click "Cancel" to return to `/dashboard`. After a successful submit, the app navigates to `/requests/:id`.
- **Variant B**: Click "Save as draft" to save and return to the dashboard. Click "Continue" to move to step 2. Complete all 3 steps to submit. After submit, the vendor invite is sent and the app returns to the dashboard.

---

## Variant A — Requirement creation form (implemented)

**Route**: `/requests/new`

**Structure**: Single centered column (`max-w-2xl`), inside the AppShell.

### Header

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Back link | Link | "Back to requirements" | Enabled | Navigates to `/dashboard` |
| Page title | Heading (h1) | "New requirement" | Static | Read-only |
| Subtitle | Text | "Define the part and process, then shortlist vendors." | Static | Read-only |

### Form fields

| Element | Type | Label | Placeholder / Helper | Required | Behavior |
|---------|------|-------|---------------------|----------|----------|
| Title | Text input | "Title" | "e.g. Forged steering knuckles" | Yes | Validates via `createRequirementSchema` (Zod) |
| Part category | Text input | "Part category" | "e.g. Casting" | No | Free text |
| Process categories | Multi-select chips | "Process categories" | One chip per value in `PROCESS_CATEGORIES` | No | Toggle on click. Active: indigo filled. Inactive: white with slate border. |
| Plant location | Text input | "Plant location" | "e.g. Manesar Plant 1" | No | Free text |
| Target award date | Date input | "Target award date" | Browser date picker | No | ISO date string |

### Actions (Variant A)

| Button | Trigger | Success state | Error state |
|--------|---------|---------------|-------------|
| Cancel | Click | Navigates to `/dashboard` | N/A |
| Create requirement | Submit | Creates the requirement via API. Navigates to `/requests/:id`. | Error banner or Zod field errors. |

### Data fields (Variant A)

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| title | String | Not empty (Zod schema) | Yes |
| partCategory | String | Trimmed, optional | No |
| processCategories | String array | Values from `PROCESS_CATEGORIES` | No |
| plantLocation | String | Trimmed, optional | No |
| targetAwardDate | ISO 8601 date string | Valid date or absent | No |

---

## Variant B — Vendor onboarding intake form (mock, not yet implemented)

**Route**: `/vendors/new` (proposed)

**Structure**: Form area (flex 1) + right sidebar (260 px fixed).

### Step indicator

A 3-step horizontal indicator at the top of the form area.

| Step | Label | Visual (step 1 active) |
|------|-------|------------------------|
| 1 | Basics | Active: red border circle, bold label |
| 2 | Documents | Pending: gray circle, normal label |
| 3 | Review | Pending: gray circle, normal label |

Done steps show a dark filled circle with a checkmark.

### Step 1: Basics

| Element | Type | Label | Placeholder / Helper | Layout | State | Behavior |
|---------|------|-------|---------------------|--------|-------|----------|
| Title | Heading (h1) | "New Vendor Onboarding Request" | -- | Full width | Static | Read-only |
| Vendor name | Text input | "Vendor name *" | -- | Column 1 | Empty, required | Validates on blur: not empty |
| Contact email | Text input | "Vendor contact email *" | Helper: "We'll send status updates here" | Column 2 | Empty, required | Validates on blur: valid email format |
| Vendor type | Radio group | "Vendor type *" | Helper: "Production-part suppliers add a Quality (IATF/PPAP) review step" | Full width span | Required, first option pre-selected | See radio options below |
| Business justification | Textarea | "Business justification *" | -- | Full width span | Empty, required | Validates on blur: not empty |
| Save as draft button | Button (outline) | "Save as draft" | -- | Left | Enabled | Saves form data as a draft |
| Continue button | Button (dark filled) | "Continue" with right arrow | -- | Right | Enabled when required fields are valid | Moves to step 2 |

#### Radio group: Vendor type

| Option | Label | Selected state |
|--------|-------|----------------|
| Production-part supplier | "Production-part supplier" | Red border, filled radio dot |
| Indirect / services vendor | "Indirect / services vendor" | Default border, empty radio dot |

### Step 2: Documents (to be designed)

The mock does not show this step's content. The suggested field set is:

| Element | Type | Label | Required | Behavior |
|---------|------|-------|----------|----------|
| Document upload | File input (multi) | "Attach supporting documents" | No | Accept PDF, DOCX, XLSX. Max 1 MB per file. |
| Notes | Textarea | "Notes for reviewers" | No | Free text |
| Back button | Button (outline) | "Back" | -- | Returns to step 1 |
| Continue button | Button (dark filled) | "Continue" | -- | Moves to step 3 |

This step needs a design review before implementation.

### Step 3: Review

A read-only summary of all data from steps 1 and 2.

| Element | Type | Behavior |
|---------|------|----------|
| Vendor name | Read-only text | Shows the value from step 1 |
| Contact email | Read-only text | Shows the value from step 1 |
| Vendor type | Read-only text | Shows the selected option |
| Business justification | Read-only text | Shows the value from step 1 |
| Attached documents | File list | Shows file names from step 2 |
| Route preview | List | Same items as the sidebar |
| Back button | Button (outline) | Returns to step 2 |
| Submit button | Button (dark filled) | Creates the request, sends the vendor invite, and navigates to `/dashboard` |

### Right sidebar: Route preview

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Sidebar title | Heading (h3) | "This request will route to:" | Static | Read-only |
| Route item 1 | List item with arrow | "Finance -- 3 day SLA" | Static | Read-only |
| Route item 2 | List item with arrow | "Legal -- 3 day SLA" | Static | Read-only |
| Route item 3 | List item with arrow | "IT/Security -- 4 day SLA" | Static | Read-only |
| Route item 4 | List item with arrow | "Quality (PPAP/IATF) -- 5 day SLA" | Conditional | Visible only when vendor type is "Production-part supplier" |
| Helper text | Text | "Quality step only applies to production-part suppliers. You and the vendor can track progress live once submitted." | Static | Read-only |

The Quality route item appears only when the vendor type is "Production-part supplier". When the type is "Indirect / services vendor", the Quality item is hidden.

---

## Mobile layout — Variant B (Screen 1f)

**Structure**: Single column, full width.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Title | Heading | "New Vendor Request" | Static | Read-only |
| Progress bar | 3-segment bar | First segment filled | Static | Read-only |
| Step label | Text | "Step 1 of 3 -- Basics" | Static | Read-only |
| Vendor name | Text input | "Vendor name *" | Empty, required | Full width |
| Contact email | Text input | "Contact email *" | Empty, required | Full width |
| Vendor type | Radio cards | Same two options | Required | Stacked cards, full width |
| Back button | Button (outline) | "Back" | Flex 1 | Disabled on step 1, returns to previous step on later steps |
| Next button | Button (dark) | "Next" | Flex 2 | Moves to the next step |

---

## Data fields (Variant B)

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Vendor name | String | Not empty, max 200 characters | Yes |
| Vendor contact email | String (email) | Valid email format (RFC 5322) | Yes |
| Vendor type | Enum: `production-part`, `indirect-services` | Must be one of the two values | Yes |
| Business justification | String | Not empty, max 2000 characters | Yes |
| Draft status | Boolean | true or false | Derived |
| Created by | User reference | Auto-set to the current user | Derived |
| Created at | ISO 8601 datetime | Auto-set on creation | Derived |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Step active | Red border circle | The user is on this step |
| Step done | Dark filled circle with checkmark | The user completed this step |
| Step pending | Gray circle | The user has not reached this step |
| Field error | Red border, red helper text | The field has a validation error |
| Field valid | Default border | The field passed validation |

## Flow connections

| From | Action | Destination |
|------|--------|-------------|
| Dashboard | Click "New requirement" | `/requests/new` (Variant A) |
| Variant A form | Submit | `/requests/:id` (new requirement detail page) |
| Variant A form | Cancel | `/dashboard` |
| Variant B wizard | Submit (step 3) | `/dashboard` (vendor invite is sent) |
| Variant B wizard | Save as draft | `/dashboard` |

## Actions (Variant B)

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Save as draft | Click | Toast: "Draft saved." Navigates to `/dashboard`. | Toast: "Failed to save draft. Try again." |
| Continue / Next | Click | Moves to the next step | Highlights required fields with errors |
| Back (mobile) | Click | Returns to the previous step | N/A |
| Vendor type radio | Click | Selects the option. Updates the route preview sidebar. | N/A |
| Submit (step 3) | Click | Creates the request. Sends the vendor invite. Toast: "Request submitted." Navigates to `/dashboard`. | Toast: "Could not submit. Check your connection and try again." |

## Business rules

1. **Variant A** has a single step. The form validates with `createRequirementSchema` (Zod). On success the API returns the new record. The app navigates to `/requests/:id`.
2. **Variant B** has 3 steps: Basics, Documents, Review.
3. Step 1 (Basics) collects vendor name, contact email, vendor type, and business justification.
4. When the vendor type is "Production-part supplier", show the Quality step in the route preview sidebar.
5. When the vendor type is "Indirect / services vendor", hide the Quality step from the route preview sidebar.
6. The "Continue" button is disabled until all required fields on the current step are valid.
7. A draft saves all entered data. The user can return to the draft later from the dashboard.
8. The request ID (`VR-NNNN`) is generated only after the final submission, not during drafting.
9. The contact email receives a vendor invite after the request is submitted (Variant B only).
10. The form does not allow the user to skip steps. Steps must be completed in order.
11. On step 3 (Review), the user sees all entered data and confirms before submission.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| User navigates away without saving | Show a confirmation dialog: "You have unsaved changes. Leave without saving?" |
| Email is not a valid format (Variant B) | Show field error: "Enter a valid email address." |
| Vendor name is empty on blur (Variant B) | Show field error: "Vendor name is required." |
| Business justification exceeds 2000 characters | Show field error: "Justification must be 2000 characters or fewer." |
| Network error on save | Toast: "Could not save. Check your connection and try again." |
| Loading state (draft restore) | Show skeleton inputs until the draft data loads. |
| Duplicate vendor name | Show a warning (not an error): "A vendor with this name already exists. Continue if this is a new request." |
| Back button on step 1 | The button is disabled on step 1. |
| Title is empty (Variant A) | Zod validation shows a field error below the title input. |
