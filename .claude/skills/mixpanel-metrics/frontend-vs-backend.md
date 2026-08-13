# Frontend vs Backend — Decision Framework

Use this when the user is unsure whether to track an event from the browser or the server. Present it as guidance, not a rule. If the user has already decided, skip this entirely.

## Choose FRONTEND when

- The event is a UI interaction (click, hover, toggle, scroll)
- You need browser context ($browser, $device, $os, $referrer, $current_url)
- You want to measure time spent on a task (use `time_event()`)
- The event has no server-side consequence (e.g., opening a dropdown)
- Autocapture already covers it (clicks on buttons, links, form submissions)

## Choose BACKEND when

- The event is a business transaction (a row was written to the database)
- Accuracy matters — ad-blockers cannot block server-side calls
- The event happens without UI (cron job, webhook, background task)
- You need server-derived data that the frontend does not have (computed scores, total days, verification results)
- Multiple clients can trigger the same action (web, mobile, API) and you want one source of truth

## Choose BOTH when

- You want UI context (duration, device) AND guaranteed delivery
- Example: track "form_submitted" on the frontend for $duration, track "prequal_decided" on the backend for accuracy

## Quick decision table

| Signal | Points to |
|---|---|
| User clicked a button | Frontend |
| A database row was created/updated | Backend |
| You want $duration | Frontend (`time_event`) |
| Ad-blocker risk is unacceptable | Backend |
| Event fires from a cron or queue | Backend |
| You need $browser, $device, $referrer | Frontend |
| Multiple platforms (web + mobile + API) | Backend |
| You want both duration AND accuracy | Both |

## How to present this to the user

Do NOT walk through the entire framework. Instead:
1. Read their request.
2. Pick the obvious choice.
3. State it in one sentence with the reason.
4. Ask if it fits.

Example: "This is a database write, so I suggest backend tracking — it cannot be blocked by ad-blockers. Does that work for you?"

If the user does not engage with the question, use the obvious choice and move on.
