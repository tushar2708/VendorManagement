# FRD 17 — Publish to Directory

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/award` (action within score/award screen) or automatic after pre-qual approval |
| Screens | Score, Clear & Award (journey step 7) |
| Role | Buyer |

## Purpose

The buyer publishes cleared vendors to the verified vendor directory after they pass pre-qualification scoring. This action sets `isInDirectory: true` and `isVerified: true` on the vendor record. Published vendors appear in the directory and can be selected for future requirements.

This is a business action, not a standalone screen. The mock (journey step 7 -- "Publish to directory") shows the vendor directory view as the result of this action. The trigger lives on the score/award screen.

## Entry points

- Click "Keep others warm" on the score/award screen (`/requests/:id/award`).
- Automatic publish after the buyer confirms the award for the winning vendor.
- A future bulk action from the vendor directory management page.

## Exit points

- The buyer stays on the score/award screen after the warm-pool publish.
- The buyer navigates to the full pack upload screen after confirming the award.

---

## Component inventory

No new screen is needed. The action uses these existing elements on the score/award screen.

| Element | Type | Label | Behavior |
|---------|------|-------|----------|
| Keep others warm | Button (outline) | "Keep others warm" | Sets `isInDirectory: true` and `isVerified: true` on all non-awarded candidates that passed pre-qual |
| Confirm award | Button (dark) | "Confirm award -> open full pack" | Sets the awarded vendor as verified and directory-listed, then navigates to the full pack screen |

The vendor directory screen (`/directory`) shows the result. Each published vendor appears with a "verified" badge.

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Vendor ID | UUID | Must reference a valid vendor record | Yes |
| isInDirectory | Boolean | Default: `false` | Yes |
| isVerified | Boolean | Default: `false` | Yes |
| verifiedAt | ISO 8601 datetime | Set when the vendor is published | Derived |
| verifiedByUserId | UUID | The buyer who triggered the publish | Derived |
| Pre-qual score | Integer | Range 0--100; must exist before publish | Yes |
| Verification status | Enum: `all-clear`, `risk` | Must be `all-clear` for automatic publish | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Verified | Green badge (`#3f8f52`) | The vendor passed pre-qual and is directory-listed |
| Not in directory | No badge | The vendor has not been published |
| Warm pool | Default row style | The vendor is cleared but not awarded; stays available for future requirements |
| Awarded | Dark badge (`#1a1a1a`, white text), blue row highlight (`#eef3ff`) | The vendor won the current requirement and is also published |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Keep others warm | Click | Toast: "Vendors added to warm pool." Sets `isInDirectory` and `isVerified` to `true` on each cleared, non-awarded vendor. | Toast: "Failed to update warm pool." |
| Confirm award | Click | Sets `isInDirectory` and `isVerified` to `true` on the awarded vendor. Navigates to full pack. | Toast: "Could not confirm award. Try again." |

## Business rules

1. Only vendors that passed pre-qualification (score recorded, verification status `all-clear`) can be published to the directory.
2. The "Keep others warm" action publishes all non-awarded candidates that passed pre-qual. It does not publish candidates with a `risk` verification status unless the buyer overrides.
3. The awarded vendor is always published when the buyer confirms the award.
4. Publishing is idempotent. A vendor that is already in the directory stays in the directory.
5. The `verifiedAt` timestamp records when the vendor was first published. A repeat publish does not update this timestamp.
6. Published vendors appear in the directory search results with a "verified" badge.
7. Published vendors appear in the "From directory" tab of the AddCandidateModal for future requirements.
8. A buyer can remove a vendor from the directory through a separate directory management action (not covered in this FRD).

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No candidates passed pre-qual | The "Keep others warm" button is hidden. Only the awarded vendor is published. |
| All candidates have risk status | Show a warning: "Some candidates have risk flags. Review before publishing." The buyer can override per vendor. |
| Vendor already in directory | No change. The action is idempotent. |
| Network error | Toast: "Could not publish vendors. Try again." |
| Awarded vendor has risk status | The buyer chose to award despite the risk (allowed by FRD-12 rule 5). The vendor is still published. |
| No award confirmed yet | The "Keep others warm" button works independently. The buyer can add vendors to the directory without confirming an award first. |
