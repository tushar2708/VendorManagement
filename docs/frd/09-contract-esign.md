# FRD 09 — Contract E-Sign

## Page

| Field | Value |
|-------|-------|
| Route | `/requests/:id/contract` |
| Screens | 2f |
| Role | Both (Buyer reviews and signs, Vendor reviews and signs) |

## Purpose

The buyer and vendor review a contract, add redline comments, and e-sign.

## Entry points

- Click the "Contract" step in the request pipeline stepper.
- A direct URL or bookmark to `/requests/:id/contract`.

## Exit points

- Both parties sign. The system moves the request to the ERP push step.
- Click the back button to return to the request detail view.

---

## Desktop layout (Screen 2f)

**Structure**: Document preview (flex 1, left panel) + right sidebar (280 px fixed).

**Header bar**: "Contract Review > Fixed contract set"

### Left panel

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Document title | Heading (h3) | "Master Supply Agreement.pdf" | Static | Read-only |
| Document preview | Placeholder area (280 px height, bg `#fafafa`) | "Document preview" | Static | Shows the contract document |
| Add comment button | Button (outline) | "Add comment" | Enabled | Opens a text input in the redline thread |
| Agree & sign button | Button (dark) | "Agree & sign" | Enabled | Signs the contract for the current user |

### Right panel — Redline thread

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Comment card 1 | Card | "Vendor: requested payment terms change" | Timestamp "2d ago" | Read-only |
| Comment card 2 | Card | "Buyer: 30-day net approved" | Timestamp "1d ago" | Read-only |
| Status badge | Badge (amber border `#c99a1e`) | "Awaiting vendor signature" | Visible | Read-only, updates when state changes |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Contract ID | String | Auto-generated, unique | Yes |
| Request ID | String | Foreign key to request | Yes |
| Document name | String | Max 200 characters | Yes |
| Document data | Base64 | Max 1 MB original binary | Yes |
| Buyer signed | Boolean | Default false | Yes |
| Vendor signed | Boolean | Default false | Yes |
| Comment thread | Array of comment objects | See comment object fields | No |

### Comment object fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Comment ID | String | Auto-generated, unique | Yes |
| Author role | Enum: `buyer`, `vendor` | Must be one of the two values | Yes |
| Text | String | Max 2000 characters | Yes |
| Created at | ISO 8601 datetime | Valid datetime | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Awaiting buyer signature | Amber border (`#c99a1e`) | The buyer has not signed yet |
| Awaiting vendor signature | Amber border (`#c99a1e`) | The vendor has not signed yet |
| Both signed | Green border (`#3f8f52`) | The contract is complete |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Add comment | Click | Comment appears in the redline thread | Toast: "Failed to save comment. Try again." |
| Agree & sign | Click | Badge updates to the next state | Toast: "Signature failed. Try again." |

## Business rules

1. The contract is a fixed set. The system does not allow custom uploads.
2. Both parties must sign before the system moves to the ERP push step.
3. Comments are threaded in redline style. Each comment shows the author role and a timestamp.
4. The buyer and vendor each see the same document and thread.
5. A user cannot sign more than once.
6. After both parties sign, the system moves the request to the ERP push step automatically.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No comments yet | Show: "No comments yet. Add the first comment." |
| Network error on sign | Show toast: "Signature failed. Try again." |
| Both already signed | Hide the "Agree & sign" button. Show: "Contract signed by both parties." |
| Loading state | Show skeleton for the document preview and the thread. |
| User already signed | Disable the "Agree & sign" button. Show: "You have signed." |
