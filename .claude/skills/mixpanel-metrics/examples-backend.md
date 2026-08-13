# Backend Examples

All examples use the wrapper at `apps/api/src/lib/analytics.ts`. Import with:
```typescript
import { trackServer, setUserProfile } from "../lib/analytics.js";
```

For raw SDK access (import, people.increment, etc.):
```typescript
import Mixpanel from "mixpanel";
```

The `distinct_id` must match the user ID used in `identifyUser()` on the frontend.

---

## Track a business event in a route handler

```typescript
// In a route handler, after the DB write succeeds:
trackServer("invite_redeemed", {
  distinct_id: userId,
  requestId: invitation.requestId,
  vendorEmail: invitation.email,
});
```

---

## Track after a state transition

```typescript
// After transitioning a link to AWARDED:
trackServer("vendor_awarded", {
  distinct_id: req.user!.userId,
  requestId,
  vendorId,
  keepOthersWarm: true,
});
```

---

## Set a user profile property

```typescript
// After ERP push completes:
setUserProfile(req.user!.userId, {
  last_erp_push: new Date().toISOString(),
  total_vendors_onboarded: 5,
});
```

---

## Increment a counter on a user profile

```typescript
import Mixpanel from "mixpanel";
import { env } from "../config/env.js";

const mp = env.MIXPANEL_TOKEN
  ? Mixpanel.init(env.MIXPANEL_TOKEN, { host: "api-eu.mixpanel.com" })
  : null;

// After a vendor is onboarded:
if (mp) mp.people.increment(userId, "vendors_onboarded", 1);
```

---

## Import historical events (older than 5 days)

```typescript
// Backfill events from before Mixpanel was integrated:
if (mp) {
  mp.import("requirement_created", Math.floor(createdAt.getTime() / 1000), {
    distinct_id: userId,
    category: "Casting",
    vendorType: "PRODUCTION_PART",
  });
}
```

The `import()` function accepts a Unix timestamp (seconds, not milliseconds). Use it for events older than 5 days. The regular `track()` rejects events older than 5 days.

---

## Track inside a transaction (fire after commit)

```typescript
// Do NOT track inside a $transaction callback — if the transaction
// rolls back, the Mixpanel event is already sent and cannot be undone.
// Instead, track AFTER the transaction succeeds:

await prisma.$transaction(async (tx) => {
  await tx.vendorBuyerLink.update({ ... });
  await tx.approvalDecision.create({ ... });
});

// Transaction succeeded — now track:
trackServer("control_decided", {
  distinct_id: req.user!.userId,
  stage: "COMPLIANCE",
  decision: "APPROVED",
});
```

---

## Track with computed properties

```typescript
// After ERP push, include derived data:
const totalDays = Math.floor((Date.now() - request.createdAt.getTime()) / 86_400_000);

trackServer("erp_pushed", {
  distinct_id: req.user!.userId,
  vendorId,
  vendorCode,
  totalDays,
  contractsExecuted: 6,
});
```

---

## GDPR — delete a user profile

```typescript
if (mp) mp.people.delete_user(userId);
```
