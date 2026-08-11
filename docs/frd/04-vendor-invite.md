# FRD 04 — Vendor Invite

## Page

| Field | Value |
|-------|-------|
| Route | `/vendor/invite` |
| Screen | 2a |
| Role | Vendor |

## Purpose

The vendor receives and accepts an invitation to register as a supplier.

## Entry points

- A link in the invitation email.
- A link in the invitation WhatsApp message.

## Exit points

- Click "Start registration" to go to the vendor registration form.

---

## Layout (mobile-only, centered content)

**Structure**: Single column, centered, max-width 400 px.

### Component inventory

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Inviter name | Heading (h2) | "Acme Manufacturing invites you" | Static | Read-only |
| Registration details | Text | "Register as a supplier for: Precision Fasteners, Category: Production parts" | Static | Read-only |
| Info card | Card (beige bg `#f6f5f0`) | "Sent via Email and WhatsApp" with mail icon | Static | Read-only |
| Expiry notice | Text (inside info card) | "Link expires in 5 days . 2 reminders sent" | Dynamic | Updates based on the remaining days |
| Start registration button | Button (dark, full width) | "Start registration" with right arrow | Enabled | Navigates to the vendor registration form |
| Helper text | Text | "Takes about 10 minutes" | Static | Read-only |

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Invite token | String (UUID) | Valid UUID, not expired, not used | Yes (URL param) |
| Inviter company name | String | Max 200 characters | Yes |
| Vendor contact email | String (email) | Valid email | Yes |
| Product / service name | String | Max 200 characters | Yes |
| Category | Enum: `production-part`, `indirect-services` | Must match one value | Yes |
| Channel | Set of enums: `email`, `whatsapp` | At least one channel | Yes |
| Expiry date | ISO 8601 date | Must be in the future at time of access | Yes |
| Reminders sent | Integer | Non-negative | Derived |
| Days until expiry | Integer | Calculated: expiry date minus today | Derived |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Active invite | Default (beige card) | The invite is valid and not expired |
| Expired invite | Red text, disabled button | The link has expired |
| Used invite | Gray text, disabled button | The vendor already registered |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Start registration | Click | Navigates to the registration form. Marks the invite as "in progress". | Toast: "Could not start registration. Try again." |

## Business rules

1. The invite link contains a unique token as a URL parameter (e.g., `/vendor/invite?token={uuid}`).
2. The system validates the token on page load. If the token is invalid, show the expired state.
3. The invite expires after the number of days set by the buyer (default: 5 days).
4. The system sends up to 3 reminders: at day 2, day 4, and day 5 (last day).
5. Show the number of reminders already sent in the info card.
6. After the vendor clicks "Start registration", mark the invite as "in progress" to prevent duplicate registrations.
7. If the vendor returns to an "in progress" invite, resume the registration form instead of showing the invite page.
8. The invite page does not require authentication. The token acts as the credential.
9. The page is mobile-only by design. On desktop screens, center the content with a max-width of 400 px.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Token is invalid or missing | Show: "This invite link is not valid. Contact the buyer for a new link." Disable the button. |
| Token is expired | Show: "This invite has expired. Contact the buyer for a new link." Disable the button. |
| Token is already used | Show: "You have already started registration. Check your email for the registration link." Disable the button. |
| Network error on load | Show: "Could not verify the invite. Check your connection and try again." with a retry button. |
| Loading state | Show a centered spinner with "Verifying your invite..." text. |
| Expiry in less than 1 day | Show: "Link expires today" in red text. |
| Zero reminders sent | Show: "No reminders sent yet" instead of "0 reminders sent". |
