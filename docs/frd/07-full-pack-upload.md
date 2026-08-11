# FRD-07: Full Onboarding Pack Upload

## Page title and route

| Field | Value |
|-------|-------|
| Title | Full Onboarding Pack |
| Route | `/vendor/full-pack` |
| Screen ref | 2d |

## User role

Vendor

## Purpose

The vendor uploads all required documents to complete the full onboarding pack after an award.

## Entry points

- Redirect from the award notification email link.
- Click "Complete full pack" from the vendor status tracker.
- Direct navigation to `/vendor/full-pack`.

## Exit points

- "Submit full pack" sends the documents for deep verification. The vendor goes to a confirmation page.
- Browser back button returns to the vendor status tracker.

## Layout specification

Desktop layout with a main content area and a right sidebar.

| Breakpoint | Behavior |
|------------|----------|
| 0 -- 767 px | Single column. The sidebar stacks below the main content. |
| 768 -- 1023 px | Single column. The sidebar stacks below the main content. |
| 1024 px + | Two-column: main content (flex 1) + right sidebar (260 px, left border `2px solid #1a1a1a`). |

Panel structure:
1. Header bar with award message
2. Main content: document upload rows grouped by section
3. Submit button
4. Right sidebar: progress indicator

## Component inventory

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Header bar | Text bar | "You're awarded! Complete your full onboarding pack" | Visible | Static. Border-bottom `2px solid #1a1a1a`. |
| Section heading: Bank | Heading (h3) | "Bank details" | Visible | Groups the bank document rows. |
| Bank proof row | Upload row | "Cancelled cheque / bank proof" | Uploaded (mock shows ✓ uploaded) | Shows green bg `#f0f9f1` and green "✓ uploaded" badge when done. Shows dashed border placeholder when empty. |
| Section heading: Statutory | Heading (h3) | "Statutory documents" | Visible | Groups the statutory document rows. |
| GST certificate row | Upload row | "GST certificate" | Uploaded (mock shows ✓ uploaded) | Same behavior as bank proof row. |
| PAN card row | Upload row | "PAN card copy" | Uploaded (mock shows ✓ uploaded) | Same behavior as bank proof row. |
| Section heading: Legal | Heading (h3) | "Legal" | Visible | Groups the legal document rows. |
| NDA row | Upload row | "Signed NDA" | Not uploaded | Shows "Upload file" placeholder with dashed border `2px dashed #999`. |
| MSME row | Upload row | "MSME certificate (if applicable)" | Not uploaded | Shows "Upload file" placeholder with dashed border. Optional for non-MSME vendors. |
| Submit button | Button (dark bg `#1a1a1a`) | "Submit full pack" | Disabled | Becomes active when all required documents are uploaded. |
| Progress bar | Bar (dark fill `#1a1a1a`) | -- | 60% (mock shows 3 of 5 done) | Updates as the vendor uploads documents. Starts at 0% for a fresh vendor. |
| Progress text | Text | "[n] of [total] documents uploaded" | "3 of 5 documents uploaded" (mock demo state) | Updates with each upload. Shows "0 of 5" when no docs are uploaded. |
| Sidebar title | Heading (h3) | "Progress" | Visible | Static text. |

## Data fields

| Field name | Type | Validation | Required |
|------------|------|------------|----------|
| `bankProof` | file (Base64) | Max 1 MB. Accepted formats: PDF, JPG, PNG. | Yes |
| `gstCertificate` | file (Base64) | Max 1 MB. Accepted formats: PDF, JPG, PNG. | Yes |
| `panCardCopy` | file (Base64) | Max 1 MB. Accepted formats: PDF, JPG, PNG. | Yes |
| `signedNda` | file (Base64) | Max 1 MB. Accepted formats: PDF. | Yes |
| `msmeCertificate` | file (Base64) | Max 1 MB. Accepted formats: PDF, JPG, PNG. | No (required only for MSME vendors) |

## Status and state mapping

| Status value | Background | Badge color | Meaning |
|-------------|-----------|-------------|---------|
| Uploaded | `#f0f9f1` (green tint) | `#3f8f52` (green badge, text "uploaded") | The vendor uploaded this document. |
| Not uploaded | Transparent | -- (dashed border placeholder, text "Upload file", color `#888`) | The vendor has not uploaded this document yet. |
| Upload error | `#fef2f2` (red tint) | `#d94f2b` (red badge, text "error") | The upload failed. |

## Actions

| Element | Trigger | Success state | Error state |
|---------|---------|---------------|-------------|
| Upload file placeholder | Vendor clicks the dashed area | File picker opens. On file select: system encodes to Base64 and saves. Row changes to "uploaded" state. Progress bar updates. | Toast: "Upload failed. Check the file size (max 1 MB) and try again." |
| Uploaded row | Vendor clicks the green row | Option to replace or remove the file appears. | -- |
| Submit full pack | Vendor clicks the button | All documents are sent for deep verification. Redirect to confirmation page. | Toast: "Could not submit. Try again." |

## Business rules

1. Each document must not exceed 1 MB in size.
2. The system stores documents as Base64 data in Neon.
3. The "Submit full pack" button stays disabled until all required documents are uploaded.
4. The MSME certificate is optional for non-MSME vendors.
5. The progress bar shows the percentage of uploaded documents out of the total required.
6. The progress text shows the count (for example, "3 of 5 documents uploaded").
7. The vendor can replace an uploaded document before submission.
8. The system decodes Base64 data before it shows or downloads a document.

## Edge cases

| Case | Behavior |
|------|----------|
| Empty state | All rows show "Upload file" placeholders. The progress bar is at 0%. The submit button is disabled. |
| All required uploaded | All required rows show green "uploaded" badges. The submit button is active. The progress bar is at 100% (or 80% if MSME is not uploaded but not required). |
| File too large | Toast: "This file is larger than 1 MB. Choose a smaller file." The upload does not start. |
| Wrong file type | Toast: "This file type is not accepted. Upload a PDF, JPG, or PNG." |
| Network error during upload | Toast: "Upload failed. Check your connection and try again." The row stays in the "not uploaded" state. |
| Page reload | Uploaded documents persist. The system loads them from the database on page load. |
| Vendor not awarded | Redirect to the vendor status tracker with a message: "No award found. Contact the buyer." |
| Session expired | Redirect to the login page. On return, the page restores to its previous state. |
