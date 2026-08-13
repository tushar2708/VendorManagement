# Critical Rules

Get these wrong and the data is permanently corrupted or very expensive to fix. These apply to ALL modes.

## Project Setup

- Never track to production before creating a separate dev/staging project.
- Verify Simplified ID Merge is enabled BEFORE sending a single event. Cannot safely change after data exists.
- Set project timezone correctly at creation. Cannot change retroactively without affecting historical data.

## Identity Management

- Always call `identify(user.id)` on EVERY login AND every app re-open while already logged in.
- Always call `reset()` on logout. Failing to do so merges the next user's session with the previous one.
- Never use email as `$user_id`. Emails change. Use the database primary key.
- Never call `identify()` before creating the user in the database.
- Never call `people.set()` before `identify()`. Profiles set before identify may not merge correctly.
- Track `sign_up_completed` AFTER `identify()`, not before.
- Never merge two `$user_id` values. Not supported in Simplified API.
- Do not create User Profiles for anonymous users.

## Data Model

- Never send numeric values as quoted strings. They become non-aggregatable strings.
- Never construct event or property names dynamically at runtime. Creates thousands of unique names.
- Never use `$` or `mp_` prefixes on custom properties.
- Omit properties entirely when they have no value. Do not send `null` or `""`.
- Mixpanel is case-sensitive: `checkout_completed` is not the same as `Checkout_Completed`. Enforce snake_case from day one.
- One event, one meaning. Do not reuse one event name for two different actions.
- Before creating a new event, check existing events in Lexicon. Extend with a property when possible.
- Prefer flat properties. Avoid nested objects unless the tracking plan requires them.
- If the same event fires from both server and client, ensure consistent `distinct_id` or you will get identity graph issues.

## Compliance

- If consent is required and status is unknown, do not initialize non-essential tracking.
- Do not forward IP or sensitive attributes when customer policy disallows them.
- Collect only properties needed to answer agreed business questions.

## Governance

- Do not implement without a reviewed tracking plan (Full Implementation mode).
- Hide events before dropping them. Dropping is irreversible.
- Never drop data without a quarter of observation after hiding.

## Server-Side

- All server calls share the server IP. Forward client IP for geolocation or accept reduced accuracy.
- Always set `$insert_id` for deduplication on server-side events.
- Parse User-Agent manually for `$browser`, `$os`, `$device`.
- Server-side `track()` only accepts events within the last 5 days. Use `import()` for older events.
