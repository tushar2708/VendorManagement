# FRD 03 — New Vendor Intake Form

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/new` |
| Screens | 1e (desktop), 1f (mobile) |
| Role | Buyer |

## Purpose

The buyer creates a new vendor onboarding request.

## Entry points

- The "New request" button on the dashboard (`/dashboard`).
- A direct URL or bookmark to `/requests/new`.

## Exit points

- Click "Save as draft" to save and return to the dashboard.
- Click "Continue" to move to step 2 (Documents).
- Complete all 3 steps to submit the request and land on the dashboard.

---

## Desktop layout (Screen 1e)

**Structure**: Form area (flex 1) + right sidebar (260 px fixed).

### Step indicator

A 3-step horizontal indicator at the top of the form area.

| Step | Label | Visual (step 1 active) |
|------|-------|------------------------|
| 1 | Basics | Active: red border circle, bold label |
| 2 | Documents | Pending: gray circle, normal label |
| 3 | Review | Pending: gray circle, normal label |

Done steps show a dark filled circle with a checkmark.

### Form fields (step 1: Basics)

| Element | Type | Label | Placeholder / Helper | Layout | State | Behavior |
|---------|------|-------|---------------------|--------|-------|----------|
| Title | Heading (h1) | "New Vendor Onboarding Request" | -- | Full width | Static | Read-only |
| Vendor name | Text input | "Vendor name *" | -- | Column 1 | Empty, required | Validates on blur: not empty |
| Contact email | Text input | "Vendor contact email *" | Helper: "We'll send status updates here" | Column 2 | Empty, required | Validates on blur: valid email format |
| Vendor type | Radio group | "Vendor type *" | Helper: "Production-part suppliers add a Quality (IATF/PPAP) review step" | Full width span | Required, first option pre-selected | See radio options below |
| Business justification | Textarea | "Business justification *" | -- | Full width span | Empty, required | Validates on blur: not empty |
| Save as draft button | Button (outline) | "Save as draft" | -- | Left | Enabled | Saves form data as a draft |
| Continue button | Button (dark filled) | "Continue" with right arrow | -- | Right | Enabled when required fields are valid | Moves to step 2 |

### Radio group: Vendor type

| Option | Label | Selected state |
|--------|-------|----------------|
| Production-part supplier | "Production-part supplier" | Red border, filled radio dot |
| Indirect / services vendor | "Indirect / services vendor" | Default border, empty radio dot |

### Right sidebar: Route preview

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Sidebar title | Heading (h3) | "This request will route to:" | Static | Read-only |
| Route item 1 | List item with arrow | "Finance -- 3 day SLA" | Static | Read-only |
| Route item 2 | List item with arrow | "Legal -- 3 day SLA" | Static | Read-only |
| Route item 3 | List item with arrow | "IT/Security -- 4 day SLA" | Static | Read-only |
| Route item 4 | List item with arrow | "Quality (PPAP/IATF) -- 5 day SLA" | Conditional | Visible only when vendor type is "Production-part supplier" |
| Helper text | Text | "Quality step only applies to production-part suppliers. You and the vendor can track progress live once submitted." | Static | Read-only |

---

## Mobile layout (Screen 1f)

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

## Data fields

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

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Save as draft | Click | Toast: "Draft saved." Navigates to `/dashboard`. | Toast: "Failed to save draft. Try again." |
| Continue / Next | Click | Moves to step 2 (Documents) | Highlights required fields with errors |
| Back (mobile) | Click | Returns to the previous step | N/A |
| Vendor type radio | Click | Selects the option. Updates the route preview sidebar. | N/A |

## Business rules

1. The form has 3 steps: Basics, Documents, Review.
2. Step 1 (Basics) collects the vendor name, contact email, vendor type, and business justification.
3. When the vendor type is "Production-part supplier", show the Quality step in the route preview sidebar.
4. When the vendor type is "Indirect / services vendor", hide the Quality step from the route preview sidebar.
5. The "Continue" button is disabled until all required fields on the current step are valid.
6. A draft saves all entered data. The user can return to the draft later from the dashboard.
7. The request ID (`VR-NNNN`) is generated only after the final submission, not during drafting.
8. The contact email receives a vendor invite after the request is submitted.
9. The form does not allow the user to skip steps. Steps must be completed in order.
10. On step 3 (Review), the user sees all entered data and confirms before submission.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| User navigates away without saving | Show a confirmation dialog: "You have unsaved changes. Leave without saving?" |
| Email is not a valid format | Show field error: "Enter a valid email address." |
| Vendor name is empty on blur | Show field error: "Vendor name is required." |
| Business justification exceeds 2000 characters | Show field error: "Justification must be 2000 characters or fewer." |
| Network error on save | Toast: "Could not save. Check your connection and try again." |
| Loading state (draft restore) | Show skeleton inputs until the draft data loads. |
| Duplicate vendor name | Show a warning (not an error): "A vendor with this name already exists. Continue if this is a new request." |
| Back button on step 1 | The button is disabled on step 1. |
