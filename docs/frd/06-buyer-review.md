# FRD-06: Buyer Pre-qualification Review

## Page title and route

| Field | Value |
|-------|-------|
| Title | Pre-qualification Review |
| Route | `/requests/:id/review` |
| Screen ref | 2c |

## User role

Buyer

## Purpose

The buyer reviews pre-qualification check results and approves or rejects a vendor.

## Entry points

- Click a vendor row on the dashboard pipeline view.
- Click a vendor name in the SLA admin queue.
- Direct link from an email notification.

## Exit points

- "Approve -- add to warm pool" goes to the award flow.
- "Reject" returns to the dashboard. The vendor row shows "Rejected" status.
- Browser back button returns to the previous page.

## Layout specification

Desktop layout with a main content area and a right sidebar.

| Breakpoint | Behavior |
|------------|----------|
| 0 -- 767 px | Single column. The sidebar stacks below the main content. |
| 768 -- 1023 px | Single column. The sidebar stacks below the main content. |
| 1024 px + | Two-column: main content (flex 1) + right sidebar (260 px, left border). |

Panel structure:
1. Header bar with breadcrumb
2. Main content: Verification Checklist
3. Action buttons row
4. Right sidebar: Snapshot at submission

## Component inventory

| Element | Type | Label | Default state | Behavior |
|---------|------|-------|---------------|----------|
| Header breadcrumb | Text bar | "Pre-qualification Review > [Vendor name]" | Shows the vendor name | Static. Border-bottom `2px solid #1a1a1a`. |
| Section title | Heading (h2) | "Verification Checklist" | Visible | Static text |
| PAN check row | Card with status tag | "PAN verified" | Shows result | Displays a green "pass" badge or an amber "pending" badge. |
| GSTIN check row | Card with status tag | "GSTIN verified" | Shows result | Same as PAN check row. |
| Udyam check row | Card with status tag | "Udyam registration matched" | Shows result | Same as PAN check row. |
| Bank check row | Card with status tag | "Bank penny-drop pending" | Shows result | Shows an amber "pending" badge until the penny-drop completes. |
| Reject button | Button (red outline) | "Reject" | Active | Border color `#d94f2b`, text color `#d94f2b`. |
| Approve button | Button (dark bg) | "Approve -- add to warm pool" | Active | Background `#1a1a1a`, white text. |
| Sidebar title | Heading (h3) | "Snapshot at submission" | Visible | Static text |
| Category line | Text | "Category: [value]" | Shows submitted value | Static text. Example: "Production parts". |
| Certifications line | Text | "Certifications: [value]" | Shows submitted value | Static text. Example: "ISO 9001". |
| Documents line | Text | "Uploaded: [count] documents" | Shows submitted count | Static text. Example: "6 documents". |

## Data fields

| Field name | Type | Validation | Required |
|------------|------|------------|----------|
| `requestId` | string (URL param) | Must match an existing request | Yes |
| `vendorId` | string | Must match the vendor for this request | Yes |
| `panStatus` | enum | One of: `pass`, `fail`, `pending` | Yes |
| `gstinStatus` | enum | One of: `pass`, `fail`, `pending` | Yes |
| `udyamStatus` | enum | One of: `pass`, `fail`, `pending` | Yes |
| `bankPennyDropStatus` | enum | One of: `pass`, `fail`, `pending` | Yes |
| `category` | string | Read-only, from vendor submission | Yes |
| `certifications` | string | Read-only, from vendor submission | Yes |
| `documentCount` | integer | Read-only, from vendor submission | Yes |
| `reviewDecision` | enum | One of: `approved`, `rejected` | Yes (on submit) |

## Status and state mapping

| Status value | Badge text | Border color | Text color | Meaning |
|-------------|-----------|-------------|-----------|---------|
| pass | "pass" | `#3f8f52` | `#3f8f52` | The check passed. |
| pending | "pending" | `#c99a1e` | `#c99a1e` | The check has not completed. |
| fail | "fail" | `#d94f2b` | `#d94f2b` | The check failed. |

## Actions

| Element | Trigger | Success state | Error state |
|---------|---------|---------------|-------------|
| Reject button | Buyer clicks "Reject" | Confirmation dialog appears. On confirm: vendor status changes to "Rejected". Redirect to dashboard. | Toast: "Could not save decision. Try again." |
| Approve button | Buyer clicks "Approve -- add to warm pool" | Vendor status changes to "Approved". Vendor enters the warm pool. Redirect to award flow. | Toast: "Could not save decision. Try again." |

## Business rules

1. The buyer can approve a vendor even if some checks show "pending" status.
2. The buyer must confirm a rejection through a dialog before the system saves it.
3. The sidebar shows the data that the vendor submitted. The buyer cannot edit it here.
4. Check results update in real time if a pending check completes while the page is open.
5. Only buyers with the "reviewer" permission can access this page.
6. The system logs the decision with the buyer ID and a timestamp.

## Edge cases

| Case | Behavior |
|------|----------|
| All checks pass | All rows show green "pass" badges. Both action buttons are active. |
| All checks pending | All rows show amber "pending" badges. Both action buttons are active. |
| One check fails | The failed row shows a red "fail" badge. The buyer can still approve or reject. |
| No documents uploaded | The sidebar shows "Uploaded: 0 documents". |
| Request not found | The page shows a "Request not found" message with a link to the dashboard. |
| Loading state | A skeleton loader replaces the checklist cards and sidebar content. |
| Network error | Toast: "Could not load review data. Check your connection." A retry button appears. |
| Concurrent decision | If another buyer already decided, the page shows the recorded decision and disables the buttons. |
