# Identity Management

How to wire user identity so Mixpanel merges all events (anonymous + authenticated, cross-device) into one user timeline.

## The Three Required Calls (client-side)

```
On signup:     create user in DB -> identify(user.id) -> people.set() -> track('sign_up_completed')
On login:      identify(user.id)
On app re-open: identify(user.id) if already logged in
On logout:     reset()
```

## Correct Signup Flow Order

1. Create user in database
2. Call `mixpanel.identify(user.id)`
3. Set profile properties via `mixpanel.people.set()`
4. Update super properties via `mixpanel.register()`
5. Track `sign_up_completed` (AFTER identify so it is attributed correctly)

## How Simplified ID Merge Works

When an event contains both `$device_id` and `$user_id` for the first time, Mixpanel merges all past and future events under the `$user_id` as canonical `distinct_id`. This is automatic since April 2024 for new projects.

Verify: Project Settings -> Identity Management -> confirm "Simplified API".

## Server-Side Identity

Server SDKs do not auto-generate `$device_id`. The approach:
1. Store a UUID in a cookie on first visit.
2. Pass `$device_id` on every pre-login event.
3. Pass both `$device_id` and `$user_id` on the first post-login event.
4. After that, pass only `$user_id`.

## Complexity Signals

Check for these after wiring basic identity. If present, offer a full QA pass:

| Signal | Implication |
|---|---|
| Anonymous browsing before login | Anonymous-to-authenticated bridging needed |
| Multi-device or multi-platform usage | Cross-device identity testing needed |
| Shared devices or account switching | Reset logic needs careful placement |
| SSO with multiple identity providers | Identity source must be stable |

## ID Management QA Checklist

Run this in the dev environment before production:

1. Create a new account. Verify `sign_up_completed` is attributed to the new user ID.
2. Log out. Verify `reset()` clears the identity.
3. Log in as a different user. Verify events are attributed to the second user, not the first.
4. Close the browser. Re-open while logged in. Verify `identify()` fires on app re-open.
5. If anonymous browsing exists: browse anonymously, then sign up. Verify pre-signup events merge into the new user.
6. If multi-device: log in on two devices. Verify both timelines merge under the same user ID.

## Critical Rules

- Never use email as `$user_id` — emails change. Use the database primary key.
- Never call `identify()` before creating the user in the database.
- Never call `people.set()` before `identify()`.
- Never merge two `$user_id` values — not supported in Simplified API.
- Do not create User Profiles for anonymous users.
- Always call `reset()` on logout — failing to reset merges the next user's session with the previous one.

## Reference

- [Mixpanel Identify Users](https://docs.mixpanel.com/docs/quickstart/identify-users)
