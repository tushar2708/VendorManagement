# Compliance and Privacy

This is implementation guidance, not legal advice. Use customer policy and legal counsel as the source of truth when there is a conflict.

## When Consent is Required

| Scenario | Default behavior |
|---|---|
| EU/EEA/UK/CH or CA users | Treat consent as required before non-essential tracking; apply consent gate before SDK initialization |
| Region unknown | Ask once; if still unknown, use conservative consent-gated behavior |
| Server-side geolocation | Only forward IP when customer policy permits; otherwise omit IP |
| Identity/profile enrichment | Track minimum required attributes only |

**Fail-safe:** If consent status is unknown in a regulated context, delay tracking initialization.

## Consent Gate Pattern (Frontend)

Initialize Mixpanel ONLY after the user grants consent:

```typescript
import mixpanel from "mixpanel-browser";

function onConsentGranted(token: string) {
  mixpanel.init(token, {
    autocapture: true,
    api_host: "https://api-eu.mixpanel.com",
  });
  // Now safe to track
}

function onConsentRevoked() {
  mixpanel.opt_out_tracking();
}
```

Do NOT call `mixpanel.init()` before consent is granted. Events fired before consent in a regulated context require data deletion.

## Consent Gate Pattern (Backend)

Server-side tracking does not need a consent gate on the SDK init (the server is not the user's device). But:
- Do NOT track events for users who have revoked consent.
- Store consent status per user in your database.
- Check consent before every `trackServer()` call:

```typescript
if (user.consentGranted) {
  trackServer("event_name", { distinct_id: user.id, ... });
}
```

## Opt-Out / Opt-In

```typescript
// User revokes consent:
mixpanel.opt_out_tracking();

// User grants consent:
mixpanel.opt_in_tracking();
```

## Server-Side Geolocation Warning

All server-side calls originate from the same IP (the server). Mixpanel uses IP for geolocation. Without the client IP forwarded, all users appear at the data center location.

Options:
1. Forward the client IP in the event properties (if policy permits).
2. Accept reduced geo accuracy (country/city will be wrong).
3. Set geo properties manually from the client-side session.

## Data Minimization

- Collect only properties needed to answer agreed business questions.
- Do not track PII unless explicitly approved.
- Avoid sensitive categories (health, financial, biometric) unless required and approved.

## GDPR Deletion

```typescript
// Frontend:
mixpanel.people.delete_user();

// Backend:
mp.people.delete_user(userId);
```

## Reference

- [Mixpanel Privacy & Compliance](https://docs.mixpanel.com/docs/privacy/overview)
- [EU Data Residency](https://docs.mixpanel.com/docs/privacy/eu-residency)
