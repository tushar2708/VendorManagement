# FRD-08: Deep Verification and Approvals Status

## Page title and route

| Field | Value |
|-------|-------|
| Title | Deep Verification Results / Verification & approvals status |
| Route | `/requests/:id/verification` |
| Screen ref | 2e + Verification Status |

## User role

Buyer

## Purpose

The buyer views deep verification results and makes approval decisions. The buyer also views combined automated checks and internal sign-off status on the same page.

## Entry points

- Click "View verification" from the dashboard pipeline for an awarded vendor.
- Click a vendor row in the SLA admin queue after the full pack is submitted.
- Direct link from an email notification.

## Exit points

- "Approve manually" records the approval and reloads the page with the updated status.
- "Send back to vendor" returns the vendor to the full-pack upload screen for corrections.
- "All clear -- proceed to contract" goes to the contract review screen.
- "Flag issue" sends the vendor back for document corrections and returns to the dashboard.

## Layout specification

Desktop layout with a main content area and a right sidebar.

| Breakpoint | Behavior |
|------------|----------|
| 0 -- 767 px | Single column. The sidebar stacks below the main content. |
| 768 -- 1023 px | Single column. The sidebar stacks below the main content. |
| 1024 px + | Two-column: main content (flex 1) + right sidebar (260 px, left border `2px solid #1a1a1a`). |

Panel structure (Deep Verification -- upper section):
1. Header bar with breadcrumb
2. Verification result rows
3. Decision card (when a manual decision is needed)

Panel structure (Approvals Status -- lower section):
4. Section title and subtitle
5. Automated (Platform) check rows
6. Internal sign-off (Buyer) rows
7. Action buttons

Right sidebar:
8. Uploaded documents list

## Component inventory

### Deep Verification section

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Header breadcrumb | Text bar | "Deep Verification Results > [Vendor name]" | Shows vendor name | Static. Border-bottom `2px solid #1a1a1a`. |
| Penny-drop row | Card with status tag | "Penny-drop bank match" | Shows result | Green "Pass" badge or amber/red badge. |
| Filings row | Card with status tag | "Company filings lookup" | Shows result | Green "Pass" or amber "Partial match" badge. |
| Director row | Card with status tag | "Director/UBO screening" | Shows result | Green "Pass" badge or amber/red badge. |
| Decision card | Card (amber bg `#fff9ec`) | "Reviewer decision needed -- name match band: partial ([score]%)" | Visible when any check is "Partial match" | Shows the match percentage and two action buttons. |
| Send back button | Button (red outline) | "Send back to vendor" | Active | Border `#d94f2b`, text `#d94f2b`. |
| Approve manually button | Button (dark bg `#1a1a1a`) | "Approve manually" | Active | White text. |

### Verification & Approvals Status section

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Section title | Heading (h2) | "Verification & approvals status" | Visible | Static text. |
| Section subtitle | Text | "Automated checks plus internal sign-off, in one place" | Visible | Static text. |
| Platform header | Section header | "Automated (Platform)" | Visible | Text color `#8a6d3b` (brown). Bold. |
| Penny-drop row (status) | Row with tag | "Penny-drop bank match" | Shows result | Green "Pass" badge. |
| Filings row (status) | Row with tag | "Company filings lookup" | Shows result | Amber "Partial match" or green "Pass" badge. |
| Director row (status) | Row with tag | "Director/UBO screening" | Shows result | Green "Pass" badge. |
| Buyer header | Section header | "Internal sign-off (Buyer)" | Visible | Text color `#5b52d6` (purple). Bold. |
| Quality row | Row with tag | "Quality -- PPAP/IATF" | Shows result | Green "Approved" or amber "Pending" badge. |
| Finance row | Row with tag | "Finance -- payment terms & bank" | Shows result | Green "Approved" or amber "Pending" badge. |
| Tax row | Row with tag | "Tax -- GST/withholding" | Shows result | Green "Approved" or amber "Pending" badge. |
| Flag issue button | Button (red outline) | "Flag issue" | Active | Border `#d94f2b`, text `#d94f2b`. |
| Proceed button | Button (dark bg `#1a1a1a`) | "All clear -- proceed to contract" | Disabled until all sign-offs are "Approved" | White text. |

### Right sidebar

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Sidebar title | Heading (h3) | "Documents" | Visible | Static text. |
| Document link: Bank proof | File link | "Bank proof.pdf" | Visible | Click to download or preview. Icon: document emoji. |
| Document link: GST cert | File link | "GST certificate.pdf" | Visible | Click to download or preview. |
| Document link: Filings | File link | "Filings report.pdf" | Visible | Click to download or preview. |

## Data fields

| Field name | Type | Validation | Required |
|------------|------|------------|----------|
| `requestId` | string (URL param) | Must match an existing request | Yes |
| `vendorId` | string | Must match the vendor for this request | Yes |
| `pennyDropResult` | enum | One of: `Pass`, `Fail`, `Partial match` | Yes |
| `filingsResult` | enum | One of: `Pass`, `Fail`, `Partial match` | Yes |
| `directorScreeningResult` | enum | One of: `Pass`, `Fail`, `Partial match` | Yes |
| `matchScore` | integer (0--100) | Present when any result is "Partial match" | Conditional |
| `qualitySignOff` | enum | One of: `Approved`, `Pending`, `Rejected` | Yes |
| `financeSignOff` | enum | One of: `Approved`, `Pending`, `Rejected` | Yes |
| `taxSignOff` | enum | One of: `Approved`, `Pending`, `Rejected` | Yes |
| `reviewerDecision` | enum | One of: `approved_manually`, `sent_back`, `flagged` | Yes (on action) |

## Status and state mapping

| Status value | Badge text | Border/text color | Meaning |
|-------------|-----------|------------------|---------|
| Pass | "Pass" | `#3f8f52` (green) | The automated check passed. |
| Partial match | "Partial match" | `#c99a1e` (amber) | The automated check found a partial match. A reviewer must decide. |
| Fail | "Fail" | `#d94f2b` (red) | The automated check failed. |
| Approved | "Approved" | `#3f8f52` (green) | The internal team approved this area. |
| Pending | "Pending" | `#c99a1e` (amber) | The internal team has not reviewed this area yet. |
| Rejected | "Rejected" | `#d94f2b` (red) | The internal team rejected this area. |

## Actions

| Element | Trigger | Success state | Error state |
|---------|---------|---------------|-------------|
| Send back to vendor | Buyer clicks the button in the decision card | Vendor status changes to "Returned". Vendor gets a notification to fix documents. Page reloads with the updated state. | Toast: "Could not send back. Try again." |
| Approve manually | Buyer clicks the button in the decision card | The partial-match result is overridden. The decision card hides. The row shows "Pass (manual)". | Toast: "Could not save approval. Try again." |
| Flag issue | Buyer clicks the button in the approvals section | Vendor status changes to "Flagged". Vendor gets a notification. Redirect to dashboard. | Toast: "Could not flag issue. Try again." |
| All clear -- proceed to contract | Buyer clicks the button | Redirect to the contract review screen at `/requests/:id/contract`. | Toast: "Could not proceed. Try again." |
| Document link | Buyer clicks a file name | The system decodes the Base64 data and opens the file in a new tab or downloads it. | Toast: "Could not load document. Try again." |

## Business rules

1. If any automated check returns "Partial match", the system shows the decision card. The reviewer must choose to approve or send back.
2. A manual approval overrides a partial-match result. The system records the reviewer ID and the timestamp.
3. All three internal sign-offs (Quality, Finance, Tax) must show "Approved" before the "proceed to contract" button becomes active.
4. The "Flag issue" button sends the vendor back for document corrections at any time.
5. Only buyers with the "reviewer" permission can access this page.
6. The system logs every action with the buyer ID, a timestamp, and a reason (if provided).
7. The automated check results come from the platform. The buyer cannot change them directly.
8. A manual approval does not change the underlying automated result. It records a separate override.

## Edge cases

| Case | Behavior |
|------|----------|
| All automated checks pass | No decision card appears. The approvals section shows the automated results. |
| Multiple partial matches | The decision card shows the lowest match score. The buyer must approve or send back for all partial results. |
| All sign-offs approved | The "proceed to contract" button becomes active. |
| Some sign-offs pending | The "proceed to contract" button stays disabled. A tooltip shows: "Wait for all sign-offs." |
| A sign-off is rejected | The "proceed to contract" button stays disabled. The "Flag issue" button is highlighted. |
| No documents in sidebar | The sidebar shows: "No documents uploaded yet." |
| Loading state | Skeleton loaders replace the check rows, the decision card, and the sidebar list. |
| Network error | Toast: "Could not load verification data. Check your connection." A retry button appears. |
| Vendor already sent back | The page shows a banner: "This vendor was sent back on [date]. Wait for resubmission." All action buttons are disabled. |
| Request not found | The page shows: "Request not found" with a link to the dashboard. |
