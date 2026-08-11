# FRD-05: PAN and GSTIN Entry with Auto-verification

## Page title and route

| Field | Value |
|-------|-------|
| Title | Verify your business |
| Route | `/vendor/prequal` |
| Screen ref | 2b |

## User role

Vendor

## Purpose

The vendor enters a PAN and GSTIN. The system auto-verifies each number in real time.

## Entry points

- Magic link from the buyer invite email or WhatsApp message.
- The "Start registration" button on the vendor welcome screen.

## Exit points

- "Continue" button goes to the next pre-qualification step (Step 2 of 4).
- The browser back button returns to the welcome screen.

## Layout specification

Mobile-first layout, single column.

| Breakpoint | Behavior |
|------------|----------|
| 0 -- 767 px | Full-width single column, 16 px padding |
| 768 px + | Centered card, max-width 480 px |

Panel structure:
1. Title and subtitle bar
2. Form fields (stacked)
3. Info card
4. Action button

## Component inventory

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Page title | Heading (h1) | "Verify your business" | Visible | Static text |
| Step indicator | Subtitle text | "Step 1 of 4 -- Identity checks" | Visible | Static text |
| PAN field | Text input | "PAN number *" | Empty | Accepts 10 characters. Shows green check mark when the system verifies the PAN. |
| GSTIN field | Text input | "GSTIN *" | Empty | Accepts 15 characters. Shows green check mark when the system verifies the GSTIN. |
| Verify info card | Card (beige bg `#f6f5f0`) | "Auto-verifying PAN, GST, Udyam..." | Hidden | Appears when the system starts a verification check. |
| Continue button | Button (dark bg `#1a1a1a`, white text) | "Continue" | Disabled | Becomes active when the PAN verification passes. Full width. |

## Data fields

| Field name | Type | Validation | Required |
|------------|------|------------|----------|
| `pan` | string(10) | Regex: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` (5 letters + 4 digits + 1 letter) | Yes |
| `gstin` | string(15) | Regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9]{1}$` (2 digits + PAN + 1 alphanumeric + Z + 1 digit) | Yes |

## Status and state mapping

| Status value | Color | Hex | Meaning |
|-------------|-------|-----|---------|
| Verified | Green check mark | `#3f8f52` | The system confirmed the number against the government database. |
| Not verified | No indicator | -- | The system has not yet confirmed the number. |
| Verifying | Amber spinner | `#c99a1e` | The system is checking the number. |
| Failed | Red cross | `#d94f2b` | The number did not pass the verification check. |

## Actions

| Element | Trigger | Success state | Error state |
|---------|---------|---------------|-------------|
| PAN input (on change) | User types or pastes a valid PAN format | System calls the verification API. Green check mark appears next to the field. | Toast: "PAN verification failed. Check the number and try again." |
| GSTIN input (on change) | User types or pastes a valid GSTIN format | System calls the verification API. Green check mark appears next to the field. | Toast: "GSTIN verification failed. Check the number and try again." |
| Continue button | User clicks the button | Navigate to step 2 of 4. Save PAN and GSTIN to the vendor record. | Toast: "Could not save. Try again." |

## Business rules

1. The PAN format must match 5 uppercase letters + 4 digits + 1 uppercase letter.
2. The GSTIN format must match 2 digits + PAN + 1 alphanumeric + "Z" + 1 digit.
3. The GSTIN must contain the same PAN in positions 3--12.
4. Auto-verification starts when the field value matches the full format.
5. A green check mark appears next to a field when verification passes.
6. The "Continue" button stays disabled until the PAN is verified.
7. The system verifies PAN, GST, and Udyam in parallel after the user enters both numbers.

## Edge cases

| Case | Behavior |
|------|----------|
| Empty state | Both fields are empty. The info card is hidden. The "Continue" button is disabled. |
| Partial input | The system does not call the verification API until the format is valid. |
| Verification in progress | The info card shows "Auto-verifying PAN, GST, Udyam..." with a spinner icon. |
| PAN verified, GSTIN pending | The PAN field shows a green check mark. The GSTIN field shows no indicator. The "Continue" button is active (PAN verified). |
| Verification timeout | After 30 seconds, the system shows a toast: "Verification timed out. Try again." |
| Network error | Toast: "Network error. Check your connection and try again." |
| Duplicate PAN | Toast: "This PAN is already linked to another vendor. Contact support." |
| Page reload | The system saves field values to session storage. Fields restore on reload. |
