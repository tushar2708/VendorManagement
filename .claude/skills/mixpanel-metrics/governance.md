# Data Governance

How to keep event names and properties consistent as the team grows.

## Roles

| Role | Responsibility |
|---|---|
| **Data Owner** | Approves new events before they go live |
| **Analyst / PM** | Documents use cases; verifies events match tracking plan |
| **Engineer** | Implements only reviewed and approved events |
| **Data Governor** | Oversees Lexicon; enforces naming standards; runs quarterly reviews |

## Lexicon Setup (Data Management -> Lexicon)

For every shipped event, add:
- **Description** — One sentence: what triggers it, what it represents
- **Tags** — Domain/team (e.g., "onboarding", "buyer", "vendor")
- **Example property values** — So analysts know what to expect

## Data Standards (Project Settings -> Data Standards)

Enable:
- Require `snake_case` for all event and property names
- Require descriptions before events appear in reports

## Event Approval (Project Settings -> Event Approval)

Enable:
- Unreviewed event names go to a pending queue until a Data Owner approves
- Prevents test events, typos, and undocumented tracking from polluting production

## Hiding vs Dropping

- **Hide** — Still stored, removed from UI dropdowns. Use for deprecated events.
- **Drop** — Stops ingesting new data. Cannot be undone.
- Rule: hide first, observe one quarter, then drop.

## Merging Divergent Events

Lexicon -> select both events -> Merge -> choose canonical name -> update future tracking code.

## Quarterly Review

1. Audit zero-volume events (hide or drop).
2. Check for missing Lexicon descriptions.
3. Validate naming conventions on new events.
4. Review property value consistency.

## Naming Change Management

When renaming an event:
1. Add the new name to the tracking plan.
2. Ship code that sends BOTH old and new names temporarily.
3. Wait until all clients are updated (mobile app versions).
4. Stop sending the old name.
5. Merge the old name into the new in Lexicon.
