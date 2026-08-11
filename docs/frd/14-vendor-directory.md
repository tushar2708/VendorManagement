# FRD 14 — Verified Vendor Directory

## Page

| Field | Value |
|-------|-------|
| Route | `/directory` |
| Role | Buyer |

## Purpose

The buyer browses all verified vendors in the system. The directory serves as the source list for invite dispatch.

## Entry points

- The main navigation sidebar link "Vendor Directory".
- A direct URL or bookmark to `/directory`.

## Exit points

- Click a vendor card to open the vendor detail or onboarding record.
- Use the directory as a picker source from the invite dispatch screen.

---

## Desktop layout

**Structure**: Single panel, full width. No sidebar.

### Component inventory

| Element | Type | Label | State | Behavior |
|---------|------|-------|-------|----------|
| Page title | Heading (h2) | "Verified Vendor Directory" | Static | Read-only |
| Vendor card 1 | Card | "Shakti Precision Components — Production parts" | Default | Click to open vendor detail |
| Vendor card 2 | Card | "Zenith Tooling — Production parts" | Default | Click to open vendor detail |
| Vendor card 3 | Card | "Harbor Logistics — Indirect" | Default | Click to open vendor detail |
| Verified badge | Badge | "✓ verified" | Green border (`#3f8f52`), green text | Read-only, visible on every card |

### Vendor card layout

Each card uses a flex row with `justify-content: space-between`. The left side shows the vendor name and category separated by an em dash. The right side shows the verified badge. Cards stack vertically with 6 px gap.

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Vendor ID | UUID | Auto-generated, unique | Yes |
| Vendor name | String | Max 200 characters | Yes |
| Category | Enum: `production-parts`, `indirect` | Must be one of the two values | Yes |
| Verification status | Enum: `verified`, `pending`, `rejected` | Only `verified` vendors appear in this list | Yes |
| Verification date | ISO 8601 date | Valid date, not in the future | Yes |
| Pre-qual score | Integer (0-100) | Calculated from pre-qualification checks | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Verified | Green border and text (`#3f8f52`) | The vendor passed all pre-qualification checks |
| Pending | Not shown in directory | The vendor is still in pre-qualification |
| Rejected | Not shown in directory | The vendor failed pre-qualification |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Vendor card | Click | Opens the vendor detail view | Toast: "Failed to load vendor details" |

## Business rules

1. Show only vendors with a `verified` status in this list.
2. Add a vendor to the directory after it passes all pre-qualification checks.
3. Display order follows insertion order (the mock does not define a sort). A search feature is not shown in the mock but may be added as a design extension.
4. (Reserved for future search feature.)
5. Use this directory as the source when the buyer adds candidates on the invite dispatch screen.
6. Show the category label on each card to help the buyer filter by vendor type.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No verified vendors exist | Show an empty state: "No verified vendors yet. Vendors appear here after pre-qualification." |
| Network error on load | Show a retry message: "Could not load the directory. Click to retry." |
| Loading state | Show skeleton cards while vendor data loads. |
| Vendor loses verified status | Remove the vendor from the directory on the next page load. |
