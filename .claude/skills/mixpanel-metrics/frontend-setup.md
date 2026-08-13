# Frontend Mixpanel Setup

## Dependencies

Add to `apps/web/package.json` dependencies:
```json
"mixpanel-browser": "^2.55.1"
```

Run `npm install` after.

## Environment variables

Add to `.env`:
```
VITE_MIXPANEL_TOKEN=<project-token>
```

Add to `.env.example`:
```
VITE_MIXPANEL_TOKEN=
```

## Analytics wrapper

Create `apps/web/src/lib/analytics.ts`:

```typescript
import mixpanel from "mixpanel-browser";

const token = import.meta.env.VITE_MIXPANEL_TOKEN ?? "";
let initialized = false;

export function initAnalytics(): void {
  if (initialized || !token) return;
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "API_HOST_PLACEHOLDER",
  });
  initialized = true;
}

export function identifyUser(user: {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  tier?: string | null;
}): void {
  if (!initialized) return;
  mixpanel.identify(user.id);
  mixpanel.people.set({
    $email: user.email,
    $name: user.name ?? undefined,
    role: user.role,
    tier: user.tier,
  });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  mixpanel.reset();
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  mixpanel.track("page_viewed", { path });
}
```

Replace `API_HOST_PLACEHOLDER` with:
- EU: `https://api-eu.mixpanel.com`
- US: `https://api.mixpanel.com`
- India: `https://api-in.mixpanel.com`

## Initialization

In the app entry point (e.g., `App.tsx`), call `initAnalytics()` at module level:

```typescript
import { initAnalytics } from "./lib/analytics.js";
initAnalytics();
```

## User identification

In the auth provider (the component that manages login state), call `identifyUser()` when a session is restored or created, and `resetAnalytics()` on logout:

```typescript
import { identifyUser, resetAnalytics } from "@/lib/analytics.js";

// On session restore / login:
if (user) {
  identifyUser({ id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier });
} else {
  resetAnalytics();
}
```

## Autocapture

With `autocapture: true`, Mixpanel tracks clicks, form submissions, and page views automatically. Custom events via `track()` are for actions that need specific property data beyond what autocapture captures.
