# Backend Mixpanel Setup

## Dependencies

Add to `apps/api/package.json` dependencies:
```json
"mixpanel": "^0.18.0"
```

Run `npm install` after.

## Environment variables

Add to `.env`:
```
MIXPANEL_TOKEN=<project-token>
```

Add to `.env.example`:
```
MIXPANEL_TOKEN=
```

Add to the env schema (`apps/api/src/config/env.ts`):
```typescript
MIXPANEL_TOKEN: z.string().optional(),
```

## Analytics wrapper

Create `apps/api/src/lib/analytics.ts`:

```typescript
import Mixpanel from "mixpanel";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const mp = env.MIXPANEL_TOKEN
  ? Mixpanel.init(env.MIXPANEL_TOKEN, { host: "API_HOST_PLACEHOLDER" })
  : null;

export function trackServer(
  event: string,
  properties: Record<string, unknown> & { distinct_id: string },
): void {
  if (!mp) return;
  try {
    mp.track(event, properties);
  } catch (err) {
    logger.error({ err, event }, "mixpanel track failed");
  }
}

export function setUserProfile(
  userId: string,
  properties: Record<string, unknown>,
): void {
  if (!mp) return;
  try {
    mp.people.set(userId, properties);
  } catch (err) {
    logger.error({ err, userId }, "mixpanel people.set failed");
  }
}
```

Replace `API_HOST_PLACEHOLDER` with:
- EU: `api-eu.mixpanel.com`
- US: `api.mixpanel.com`
- India: `api-in.mixpanel.com`

Note: The backend SDK uses the hostname without the `https://` protocol prefix, unlike the frontend SDK.

## Usage in route handlers

```typescript
import { trackServer } from "../lib/analytics.js";

// Inside any route handler:
trackServer("vendor_awarded", {
  distinct_id: req.user!.userId,
  requestId,
  vendorId,
});
```

## Important notes

- The `distinct_id` must match the user ID used in `identifyUser()` on the frontend. This lets Mixpanel merge frontend and backend events into one user timeline.
- The wrapper is a no-op when `MIXPANEL_TOKEN` is not set. No crash, no error.
- Errors from the Mixpanel SDK are caught and logged. They never crash the request.
- Server-side `track()` only accepts events within the last 5 days. Use `mp.import()` for older events.
