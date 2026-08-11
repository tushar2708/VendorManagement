# FRD 12 — Score, Clear & Award

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/award` |
| Screens | Score, Clear & Award |
| Role | Buyer |

## Purpose

The buyer scores pre-qualified candidates, awards one vendor, and keeps the others in a warm pool for future requests.

## Entry points

- Click "Score & award" from the request detail view.
- A direct URL or bookmark to `/requests/:id/award`.

## Exit points

- Click "Confirm award → open full pack" to navigate to the full pack upload screen.
- Click the browser back button to return to the request detail view.

---

## Desktop layout

**Structure**: Single panel (no sidebar).

**Title**: "Score, clear & award"

**Subtitle**: "Cleared candidates · pre-qual scored"

### Grid table

| Column | Type |
|--------|------|
| Vendor | Text (company name) |
| Pre-qual score | "XX / 100" |
| Verification | Status text |
| Warm pool | Action button or badge |

### Data rows

| Vendor | Pre-qual score | Verification | Warm pool | Row style |
|--------|---------------|--------------|-----------|-----------|
| Shakti Precision Components | 92 / 100 | All checks green | Checkmark "Awarded" (dark badge, white text) | Blue highlight `#eef3ff` |
| Deccan Castworks | 86 / 100 | All checks green | "Award" (outline button) | Default |
| Kolhapur Foundry Works | 79 / 100 | GST filings: risk chip | "Award" (outline button) | Default |

### Bottom-right buttons

| Button | Style |
|--------|-------|
| Keep others warm | Outline |
| Confirm award → open full pack | Dark |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String | Foreign key to the request | Yes |
| Candidate ID | String | Auto-generated, unique | Yes |
| Vendor name | String | Max 200 characters | Yes |
| Pre-qual score | Integer | Range 0–100 | Yes |
| Verification status | Enum: `all-clear`, `risk` | Must be one of the two values (mock shows only these two) | Yes |
| Risk detail | String | Free text description of the risk | No |
| Awarded | Boolean | Default `false` | Yes |
| Warm pool | Boolean | Default `true` | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| All checks green | Green text | All verification checks passed |
| Risk chip | Amber text with border | One or more checks flagged a risk |
| Awarded | Dark background badge, white text, row highlight `#eef3ff` | This vendor won the award |
| Not awarded | Outline button "Award" | Vendor is available for award |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Award (per row) | Click | Row highlights blue. Badge changes to "Awarded". Previous awarded vendor reverts to outline button. | Toast: "Award failed. Try again." |
| Keep others warm | Click | Toast: "Vendors added to warm pool." | Toast: "Failed to update warm pool." |
| Confirm award → open full pack | Click | Navigate to the full pack upload screen. | Toast: "Could not confirm award. Try again." |

## Business rules

1. Only one vendor can hold the award at a time.
2. The awarded vendor row gets a blue highlight (`#eef3ff`).
3. "Confirm award" starts the full pack upload flow for the awarded vendor.
4. Non-awarded candidates stay in the warm pool for future requests.
5. A vendor with a risk chip can still be awarded at the buyer's discretion.
6. The buyer can change the award before confirmation.
7. After confirmation, the award is final and cannot be changed from this screen.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No candidates | Show: "No candidates have been scored yet." |
| All candidates failed verification | Show all rows with red status. The "Confirm award" button is disabled. |
| Network error | Show toast: "Could not load candidates. Click to retry." |
| Loading state | Show skeleton table rows. |
| Only one candidate | Show the single row. The "Keep others warm" button is hidden. |
