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

**Structure**: Single panel, no sidebar. Fills the content area of the buyer layout.

### Component inventory

| Element | Type | Label | State | Behavior |
|---------|------|-------|-------|----------|
| Page title | Heading (h2) | "Select candidates" | Static | Read-only |
| Candidate card 1 | Card | "Shakti Precision Components" | Selected | Shows selected badge |
| Candidate card 2 | Card | "Deccan Castworks" | Selected | Shows selected badge |
| Candidate card 3 | Card | "Kolhapur Foundry Works" | Selected | Shows selected badge |
| Selected badge | Badge | "✓ selected" | Visible when selected | Toggle on card click |
| Add from directory button | Button (outline) | "+ Add from directory" | Enabled | Opens a vendor directory picker dialog |
| Dispatch invites button | Button (dark, `#1a1a1a`) | "Dispatch invites →" | Enabled when at least 1 candidate is selected | Sends invites to all selected candidates |

### Candidate card layout

Each card uses a flex row with `justify-content: space-between`. The vendor name is on the left. The selected badge is on the right. Cards stack vertically with 6 px gap.

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
| Candidate card | Click | Toggles selected / unselected badge | N/A |
| + Add from directory | Click | Opens vendor directory picker dialog | Toast: "Failed to load directory" |
| Dispatch invites → | Click | Toast: "Invites sent to {N} vendors". Redirects to requirement detail. | Toast: "Failed to send invites. Try again." |

## Business rules

1. Allow the buyer to select one or more vendors from a pre-loaded candidate list.
2. Allow the buyer to add vendors from the verified directory through the picker dialog.
3. Disable the "Dispatch invites" button when no candidates are selected.
4. Send each invite through both email and WhatsApp with a unique magic link.
5. Set each invite to expire 5 calendar days after dispatch.
6. Send 2 automatic reminders if the vendor has not responded (exact cadence to be confirmed — mock screen 2a says "2 reminders sent" but does not specify which days).
7. Do not allow duplicate invites to the same vendor for the same requirement.
8. Log each dispatch event in the requirement activity feed.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No candidates pre-loaded | Show the page with an empty list and the "+ Add from directory" button. |
| All candidates removed | Disable the "Dispatch invites" button. Show hint: "Select at least one candidate." |
| Vendor already invited for this requirement | Show a warning badge "Already invited" on the card. Exclude from the dispatch batch. |
| Network error on dispatch | Toast: "Could not send invites. Check your connection and try again." |
| Loading state | Show skeleton cards while candidate data loads. |
| Directory picker returns no results | Show: "No vendors match your search" inside the picker dialog. |
