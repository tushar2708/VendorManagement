# FRD 15 — Onboarding Complete (Vendor)

## Page

| Field | Value |
|-------|-------|
| Route | `/vendor/complete` |
| Role | Vendor |

## Purpose

The vendor sees a confirmation that onboarding is finished and a vendor code is assigned.

## Entry points

- Automatic redirect after the contract is signed and the ERP push completes.

## Exit points

- Click "View my profile" to open the vendor profile page.
- Click "Download signed contract" to download the signed contract as a PDF.

---

## Mobile-first layout

**Structure**: Single column, centered content. Max width 400 px. Padding 20 px horizontal, 16 px vertical.

### Component inventory

| Element | Type | Label | State | Behavior |
|---------|------|-------|-------|----------|
| Success icon | Circle icon | Green checkmark "✓" | Static | Read-only |
| Page title | Heading (h2) | "You're onboarded!" | Static | Read-only |
| Subtitle | Paragraph | "Vendor code V-100482 assigned · took 14 days" | Static | Read-only; values are dynamic |
| View profile button | Button (dark, `#1a1a1a`, full width) | "View my profile" | Enabled | Navigates to the vendor profile page |
| Download contract button | Button (outline, full width) | "Download signed contract" | Enabled | Downloads the signed contract PDF |

### Success icon specification

- Width: 44 px
- Height: 44 px
- Border radius: 50% (circle)
- Border: 3 px solid `#3f8f52`
- Text color: `#3f8f52`
- Centered on the page with `margin: 0 auto 10px`
- Content: "✓" at 20 px font size

### Button stack

Buttons stack vertically with 8 px gap. Both buttons are full width.

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Vendor code | String (format: `V-NNNNNN`) | Matches the SAP-assigned vendor code | Yes |
| Onboarding duration | Integer (days) | Calculated: completion date minus request creation date | Derived |
| Contract document ID | UUID | Must reference a signed contract record | Yes |
| Contract PDF URL | URL | Valid, authenticated download link | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Onboarded | Green (`#3f8f52`) | The vendor finished all onboarding steps |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| View my profile | Click | Navigates to `/vendor/profile` | Toast: "Failed to load profile" |
| Download signed contract | Click | Browser downloads the PDF file | Toast: "Failed to download contract. Try again." |

## Business rules

1. Display the vendor code that SAP assigned during the ERP push step.
2. Calculate the total onboarding duration from the request creation date to the completion date.
3. Make the signed contract available as a PDF download.
4. This is a terminal screen for the vendor onboarding flow. No further steps follow.
5. Match the vendor code and duration values with what the buyer sees on the ERP handoff screen.
6. Show this screen only after both the contract is signed and the ERP push succeeds.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Contract PDF not yet available | Disable the download button. Show tooltip: "Contract is being prepared." |
| Vendor code not yet assigned | Do not show this screen. Keep the vendor on the contract step until the ERP push succeeds. |
| Network error on PDF download | Toast: "Could not download the contract. Check your connection and try again." |
| Vendor revisits this page later | Show the same confirmation with the stored vendor code and duration. |
