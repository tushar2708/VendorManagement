# Mixpanel Methods Reference

## Frontend SDK (`mixpanel-browser`)

| Method | Signature | What it does | When to use |
|---|---|---|---|
| `track` | `mixpanel.track(event, props?)` | Sends a single event | Any user action: click, submit, navigate |
| `identify` | `mixpanel.identify(userId)` | Ties all future events to this user | On login or session restore |
| `reset` | `mixpanel.reset()` | Clears identity, starts anonymous session | On logout |
| `people.set` | `mixpanel.people.set(props)` | Sets profile properties (overwrites) | Role, tier, org, plan |
| `people.set_once` | `mixpanel.people.set_once(props)` | Sets only if property does not exist | First login date, signup source |
| `people.increment` | `mixpanel.people.increment(prop, n)` | Adds n to a numeric property | Lifetime counters: logins, items created |
| `people.append` | `mixpanel.people.append(prop, value)` | Appends to a list property | Features used, tags |
| `people.union` | `mixpanel.people.union(prop, values)` | Appends to list (deduped) | Same as append but no duplicates |
| `people.track_charge` | `mixpanel.people.track_charge(amount)` | Records revenue on profile | Payments, billing |
| `people.delete_user` | `mixpanel.people.delete_user()` | Deletes the user profile | GDPR deletion |
| `register` | `mixpanel.register(props)` | Sets super properties (every event gets these) | Current org, active context |
| `register_once` | `mixpanel.register_once(props)` | Super properties, write-once | UTM source, first referrer |
| `time_event` | `mixpanel.time_event(event)` | Starts a timer; next track(event) gets $duration | Form fill time, session duration |
| `set_group` | `mixpanel.set_group(key, id)` | Assigns user to a group | Org-level analytics |
| `get_group` | `mixpanel.get_group(key, id).set(props)` | Sets group profile properties | Org plan, industry |
| `opt_out_tracking` | `mixpanel.opt_out_tracking()` | Stops all tracking | Privacy consent withdrawal |
| `opt_in_tracking` | `mixpanel.opt_in_tracking()` | Resumes tracking | Privacy consent granted |

## Backend SDK (`mixpanel` — Node.js)

| Method | Signature | What it does | When to use |
|---|---|---|---|
| `track` | `mp.track(event, { distinct_id, ...props })` | Sends an event (last 5 days only) | Real-time business events |
| `import` | `mp.import(event, timestamp, { distinct_id, ...props })` | Sends historical events (older than 5 days) | Backfilling data |
| `people.set` | `mp.people.set(userId, props)` | Sets profile properties | Server-derived data on profile |
| `people.set_once` | `mp.people.set_once(userId, props)` | Sets only if not exists | First completion date |
| `people.increment` | `mp.people.increment(userId, prop, n)` | Adds n to numeric property | Lifetime counters |
| `people.append` | `mp.people.append(userId, prop, value)` | Appends to list | — |
| `people.union` | `mp.people.union(userId, prop, values)` | Appends deduped | — |
| `people.track_charge` | `mp.people.track_charge(userId, amount)` | Revenue tracking | Billing |
| `people.delete_user` | `mp.people.delete_user(userId)` | Deletes profile | GDPR |

## Key differences

- Frontend `track()` auto-attaches browser context ($browser, $device, $os, $screen_width, $referrer, $current_url). Backend does not.
- Frontend `track()` uses the identified user automatically. Backend `track()` requires `distinct_id` in every call.
- Frontend events can be blocked by ad-blockers. Backend events always arrive.
- Backend `import()` handles events older than 5 days. Frontend has no equivalent.
- Both SDKs share the same project token. The token is a public identifier, not a secret.
