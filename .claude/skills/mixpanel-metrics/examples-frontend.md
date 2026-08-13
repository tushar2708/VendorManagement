# Frontend Examples

All examples use the wrapper at `apps/web/src/lib/analytics.ts`. Import with:
```typescript
import { track } from "@/lib/analytics.js";
```

For raw SDK access (time_event, set_group, register, etc.):
```typescript
import mixpanel from "mixpanel-browser";
```

---

## Track a button click

```typescript
function handleAward(vendorId: string) {
  track("vendor_awarded", { vendorId, requestId });
  // ... rest of the logic
}
```

---

## Track a form submission

```typescript
async function handleSubmit(data: FormData) {
  track("requirement_created", {
    category: data.category,
    vendorType: data.vendorType,
    process: data.process,
  });
  await createRequirement(data);
}
```

---

## Measure time spent on a form

```typescript
import mixpanel from "mixpanel-browser";

// When the form mounts:
useEffect(() => {
  mixpanel.time_event("prequal_submitted");
}, []);

// When the user submits:
function handleSubmit() {
  track("prequal_submitted", { vendorId, checkCount: 3 });
  // Mixpanel auto-attaches $duration (seconds spent on the form)
}
```

---

## Set a user profile property

```typescript
import mixpanel from "mixpanel-browser";

// After user completes onboarding:
mixpanel.people.set({ onboarding_completed: true, vendor_code: "0001A3B2C1" });
```

---

## Set a property only once (first occurrence)

```typescript
import mixpanel from "mixpanel-browser";

// On first login:
mixpanel.people.set_once({ first_login_at: new Date().toISOString() });
```

---

## Increment a lifetime counter

```typescript
import mixpanel from "mixpanel-browser";

// After creating a requirement:
mixpanel.people.increment("requirements_created", 1);
```

---

## Group analytics by organization

```typescript
import mixpanel from "mixpanel-browser";

// After login, when you know the org:
mixpanel.set_group("buyer_org", orgId);
// All future events carry buyer_org = orgId
```

---

## Super properties (session context)

```typescript
import mixpanel from "mixpanel-browser";

// Set once per session — attached to every event:
mixpanel.register({ current_org: orgName, user_role: "BUYER" });

// Set only if not already set (first-touch attribution):
mixpanel.register_once({ utm_source: urlParams.get("utm_source") });
```

---

## Opt out / opt in (privacy)

```typescript
import mixpanel from "mixpanel-browser";

// User declines tracking:
mixpanel.opt_out_tracking();

// User accepts tracking:
mixpanel.opt_in_tracking();
```

---

## Track a page view (manual)

```typescript
import { trackPageView } from "@/lib/analytics.js";

// In a route change handler or useEffect:
trackPageView(window.location.pathname);
```

Note: With `autocapture: true`, page views are tracked automatically. Use this only if you need custom properties on the page view event.
