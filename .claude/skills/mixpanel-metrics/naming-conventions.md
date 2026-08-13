# Naming Conventions

## Event names

- Use `snake_case`: `requirement_created`, not `RequirementCreated` or `requirement-created`.
- Use `noun_verbed` pattern: the thing first, then the action in past tense.
  - `requirement_created` (a requirement was created)
  - `vendor_awarded` (a vendor was awarded)
  - `contract_signed` (a contract was signed)
  - `invite_redeemed` (an invite was redeemed)
- Do NOT use present tense or gerunds: `creating_requirement` or `create_requirement` are wrong.
- Do NOT prefix with the product name: `vendormanagement_requirement_created` is wrong. Mixpanel already scopes by project.
- Keep it short: 2-3 words. `prequal_submitted` not `pre_qualification_form_submission_completed`.

## Property names

- Use `snake_case`: `vendor_id`, `request_id`, `total_days`.
- Do NOT use camelCase in Mixpanel properties, even if the code variable is camelCase. Convert at the call site:
  ```typescript
  track("vendor_awarded", { vendor_id: vendorId, request_id: requestId });
  ```
- Use specific names: `unit_price` not `price`, `lead_time_days` not `lead_time`.

## Reserved prefixes

- `$` — Mixpanel built-in properties. Never use this prefix for custom properties.
  - `$email`, `$name`, `$browser`, `$device`, `$os`, `$city`, `$region`, `$current_url`
- `mp_` — Mixpanel internal. Never use this prefix.

## Do

- `requirement_created`
- `invite_dispatched`
- `prequal_submitted`
- `control_decided`
- `contract_signed`
- `erp_pushed`
- `page_viewed`
- `view_switched`

## Do not

- `Create Requirement` (spaces, title case)
- `REQUIREMENT_CREATED` (all caps)
- `createRequirement` (camelCase)
- `user.created.requirement` (dots)
- `vm_requirement_created` (product prefix)
- `requirement_creation` (gerund, not past tense)

## Categories (for bulk planning)

When labeling events in a metrics plan, use one of these categories:
- `funnel` — ordered sequence toward a goal
- `engagement` — repeated value-signaling action
- `retention` — return-visit signal
- `adoption` — first-use of a feature
- `operational` — system health / error tracking
