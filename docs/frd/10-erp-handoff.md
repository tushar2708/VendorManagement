# FRD 10 — ERP Handoff

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/complete` |
| Screens | 2g |
| Role | Buyer |

## Purpose

The buyer confirms that the vendor record was pushed to SAP and views the final details.

## Entry points

- The system redirects here after a successful SAP push.
- A direct URL or bookmark to `/requests/:id/complete`.

## Exit points

- Click "View vendor record" to open the vendor detail page.

---

## Layout spec

**Structure**: Centered single column, no sidebar, max width 360 px.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Status circle | Circle (56 px, green border `#3f8f52`) | Green checkmark inside | Static | Read-only |
| Title | Heading (h2) | "Onboarding complete" | Static | Read-only |
| Subtitle | Paragraph | "Acme Fasteners Inc. has been pushed to SAP" | Static | Read-only |
| Info card | Bordered card | See fields below | Static | Read-only |
| Info: Vendor code | Label + value | "Vendor code: V-100482" | Static | Read-only |
| Info: Pushed via | Label + value | "Pushed via: Business Partner API" | Static | Read-only |
| Info: Total time | Label + value | "Total time: 14 days" | Static | Read-only |
| View vendor button | Button (dark) | "View vendor record" | Enabled | Navigates to the vendor detail page |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String | Foreign key to the onboarding request | Yes |
| Vendor code | String | Returned by SAP after a successful push | Yes |
| Push method | String (e.g. "Business Partner API") | Must match a known integration method | Yes |
| Total time | Integer (days) | Derived: completion date minus request creation date | Yes (derived) |
| Completed at | ISO 8601 datetime | Valid datetime, not in the future | Yes |
| Vendor name | String | Max 200 characters | Yes |

## Status / state mapping

| Status value | Border color | Icon | Meaning |
|--------------|-------------|------|---------|
| Push successful | Green `#3f8f52` | Checkmark | SAP accepted the vendor |
| Push failed (inferred — not in mock) | Red `#d94f2b` | X icon | SAP rejected the push |
| Push pending (inferred — not in mock) | Amber `#c99a1e` | Spinner | The push is in progress |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| View vendor record | Click | The vendor detail page loads | Toast: "Failed to load vendor record." |

## Business rules

1. The SAP push happens through the Business Partner API.
2. SAP generates the vendor code and returns it to the system.
3. The system calculates total time from the request creation date to this step.
4. This is a terminal screen. The request is closed after this step.
5. The buyer cannot reopen a completed request from this screen.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| SAP push failed | Show error state with red icon and message "Push to SAP failed. Contact IT support." |
| SAP push pending | Show spinner and message "Push in progress. This page will update automatically." |
| Network error | Show toast "Could not load completion details. Click to retry." |
| Loading state | Show skeleton for the info card and button. |
