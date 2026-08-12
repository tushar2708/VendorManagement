# FRD 13 — Dispatch Invites

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/invite` |
| Role | Buyer |

## Purpose

The buyer selects vendor candidates from the directory and sends bulk invites for a requirement.

## Entry points

- Click "Dispatch invites" from the requirement detail screen.
- Direct URL with the requirement ID.

## Exit points

- Click "Dispatch invites" button to send invites and return to the requirement detail.
- Navigate away through the main sidebar.

---

## Desktop layout

**Structure**: Single panel, no sidebar. Fills the content area of the buyer layout. The requirement detail page (`/requests/:id`) hosts the candidate table and all modals.

### Component inventory

| Element | Type | Label | State | Behavior |
|---------|------|-------|-------|----------|
| Back link | Link | "Back to requirements" | Always visible | Navigates to `/dashboard` |
| Requirement header | Heading (h1) + badge | Requirement title + stage badge | Static | Read-only |
| Candidates heading | Heading (h2) | "Candidates (N)" | Static | N = total candidate count |
| Add candidate button | Button (secondary) | "Add candidate" | Always enabled | Opens AddCandidateModal |
| Send invites button | Button (primary) | "Send invites (N)" | Disabled when no PENDING candidates exist | N = count of selected or all pending |
| Header checkbox | Checkbox | (none) | Checked / indeterminate / unchecked | Selects or deselects all PENDING candidates |
| Row checkbox | Checkbox | (none) | Visible on PENDING rows only | Toggles that candidate in the selection set |
| Edit button | Icon button (pencil) | "Edit candidate" tooltip | Visible on PENDING rows only | Opens EditCandidateModal with the candidate data |
| Remove button | Text button | "Remove" | Enabled on PENDING rows; disabled + tooltip on invited rows | Calls DELETE endpoint; refreshes list |
| Source badge | Badge | "Directory" or "Manual" | Static | Indigo for directory, slate for manual |
| Invite status badge | Badge | Status label | Static | Color per status mapping table |

### Candidate table layout

The candidate list renders as a full-width `<table>` inside a card. Columns: checkbox, Vendor, Contact, Source, Status, actions.

### AddCandidateModal

A modal dialog with two tabs.

**Tab 1 — "From directory"**

| Element | Type | Behavior |
|---------|------|----------|
| Search input | Text field | Filters the directory list with a 200 ms debounce |
| Process filter | Select dropdown | Options: HPDC, Gravity Casting, CNC Turning, VMC, Forging, Sheet Metal, Heat Treatment, Plating |
| State filter | Select dropdown | Options: Maharashtra, Tamil Nadu, Haryana, Gujarat, Punjab |
| Vendor list | Scrollable list (max 288 px) | Each row shows legal name, verified badge, city/state, and process tags |
| Checkbox per vendor | Checkbox | Toggles selection |
| Selected count | Text | Shows "N selected" |
| Add selected button | Button (primary) | Disabled when count = 0; sends all selected vendors as `source: "directory"` candidates |

The directory query passes `requirementId` so the API can exclude vendors that are already candidates on this requirement.

**Tab 2 — "Add manually"**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Vendor name | Text input | Yes | Max 200 characters |
| Contact email | Email input | Yes | Valid email format |
| Phone | Text input | No | (none) |
| PAN | Text input | No | Format hint appears if value does not match `AAAAA9999A` |
| GSTIN | Text input | No | Format hint appears if value does not match standard pattern |
| City | Text input | No | (none) |
| State | Text input | No | (none) |

The form validates with the `addCandidateSchema` from the shared package. Empty optional fields are omitted from the payload.

### EditCandidateModal

A modal dialog that opens when the buyer clicks the pencil icon on a PENDING candidate row.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Vendor name | Text input | Yes | Max 200 characters |
| Contact email | Email input | Yes | Valid email format |
| Phone | Text input | No | (none) |
| PAN | Text input | No | Format hint if invalid |
| GSTIN | Text input | No | Format hint if invalid |
| City | Text input | No | (none) |
| State | Text input | No | (none) |

The form pre-fills with the candidate's current values. Only changed fields are sent to the API. An empty optional field clears that value to null on the server. The form validates with `updateCandidateSchema`.

### SendInvitesModal

A confirmation modal that shows the list of vendors about to receive invites.

| Element | Type | Behavior |
|---------|------|----------|
| Vendor list | Scrollable list (max 224 px) | Shows legal name and contact email for each target |
| Send button | Button (primary) | Label: "Send N invite(s)"; disabled while submitting or when list is empty |
| Result view | List with status badges | After send: shows each email with "Emailed" (green) or "Logged (dev)" (amber) badge and a magic link |
| Done button | Button (primary) | Closes the modal after the result view |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Requirement ID | String (format: `VR-NNNN`) | Must exist in the system | Yes |
| Vendor ID | UUID | Must reference a valid vendor record | Yes (per candidate) |
| Vendor name | String | Max 200 characters | Yes |
| Invite channel | Enum: `email`, `whatsapp`, `both` | Default: `both` | Yes |
| Invite expiry | ISO 8601 datetime | Auto-set to 5 days from dispatch | Derived |
| Magic link token | String (UUID v4) | Auto-generated, unique per invite | Derived |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Selected | Dark badge (`#1a1a1a` text) | The candidate is included in the dispatch batch |
| Unselected | No badge | The candidate is not included |
| Invite sent | Green (`#3f8f52`) | The invite was sent |
| Invite expired | Gray (`#999`) | The 5-day window passed without a response |
| Invite opened | Amber (`#c99a1e`) | The vendor opened the link but did not complete pre-qual |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Add candidate | Click | Opens AddCandidateModal with two tabs | N/A |
| Tab: From directory — Add selected | Click | Adds selected directory vendors as candidates. Modal closes. List refreshes. | Toast: "Could not add the selected vendors." |
| Tab: Add manually — Add candidate | Submit | Creates one candidate from the form. Modal closes. List refreshes. | Inline error: "Could not add the candidate." |
| Edit (pencil icon) | Click on a PENDING row | Opens EditCandidateModal pre-filled with the candidate data | N/A |
| Save changes (edit modal) | Submit | Updates the candidate record. Modal closes. List refreshes. | Inline error: "Could not update the candidate." |
| Remove | Click on a PENDING row | Deletes the candidate. List refreshes. | Inline error: "Could not remove the candidate." |
| Remove | Click on an INVITED+ row | Returns HTTP 409. Button is disabled with tooltip: "Invited candidates can't be removed." | N/A |
| Header checkbox | Click | Selects all PENDING candidates (or deselects all if already selected) | N/A |
| Row checkbox | Click | Toggles the candidate in the selection set | N/A |
| Send invites | Click | Opens SendInvitesModal showing the target list | N/A |
| Send N invite(s) (send modal) | Click | Dispatches invites. Shows result view with per-vendor status. | Inline error: "Could not send invites." |

## Business rules

1. Allow the buyer to add candidates in two ways: pick from the vendor directory (multi-select) or enter details manually.
2. Deduplicate candidates on add. The system skips a candidate when:
   - A directory candidate's `vendorId` already exists on this requirement.
   - A candidate's PAN matches a PAN already on this requirement (applies to both directory and manual sources).
   - Skipped duplicates do not produce an error. The system adds only the non-duplicate entries.
3. Allow the buyer to edit a PENDING candidate's details (name, email, phone, PAN, GSTIN, city, state). The API returns HTTP 409 if the candidate has already been invited.
4. Allow the buyer to remove a PENDING candidate. The API returns HTTP 409 if the candidate has already been invited.
5. Show a checkbox on each PENDING candidate row. Show a header checkbox that selects or deselects all PENDING rows.
6. "Send invites" targets the selected PENDING candidates. If no checkboxes are checked, it targets all PENDING candidates.
7. Disable the "Send invites" button when no PENDING candidates exist.
8. Send each invite through both email and WhatsApp with a unique magic link.
9. Set each invite to expire 5 calendar days after dispatch.
10. Send 2 automatic reminders if the vendor has not responded (exact cadence to be confirmed -- mock screen 2a says "2 reminders sent" but does not specify which days).
11. Do not allow duplicate invites to the same vendor for the same requirement.
12. Log each dispatch event in the requirement activity feed.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No candidates exist | Show empty state card: "No candidates yet" with an "Add candidate" button. |
| All candidates already invited | Disable the "Send invites" button. Header checkbox is disabled. |
| Duplicate PAN on add | The system skips the duplicate silently. It adds only the non-duplicate entries. |
| Duplicate vendorId on directory add | The system skips the duplicate silently. |
| Edit an invited candidate | The API returns HTTP 409. The pencil icon does not appear on non-PENDING rows. |
| Remove an invited candidate | The API returns HTTP 409. The Remove button is disabled with a tooltip on non-PENDING rows. |
| Network error on dispatch | Inline error in the send modal: "Could not send invites." |
| Network error on add | Inline error in the add modal: "Could not add the selected vendors." or "Could not add the candidate." |
| Loading state | Show a centered spinner while the requirement data loads. |
| Directory tab returns no results | Show: "No matching vendors (or all already added)." inside the scrollable list. |
| Directory tab loading | Show: "Loading..." inside the scrollable list. |
| Directory tab load error | Show the error message in rose text inside the scrollable list. |
