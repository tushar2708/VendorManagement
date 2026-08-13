# Product Metrics

Mixpanel event catalog for the Vendrax vendor management platform. Each row is a custom `track()` or `trackServer()` call. Autocapture handles page views and basic clicks.

## Event Catalog

| Event | Trigger | Side | Properties | Category | Priority |
|---|---|---|---|---|---|
| `requirement_created` | Buyer creates a requirement | Backend | request_id, category, vendor_type, process | Funnel | P0 |
| `candidates_shortlisted` | Buyer adds candidates | Backend | request_id, count, source | Funnel | P0 |
| `invites_dispatched` | Buyer sends magic links | Backend | request_id, count, sent_count | Funnel | P0 |
| `invite_redeemed` | Vendor registers via invite | Backend | request_id, vendor_email, link_id | Funnel | P0 |
| `prequal_submitted` | Vendor submits prequal | Backend | link_id, request_id, field_count, doc_count | Funnel | P0 |
| `prequal_decided` | Buyer clears or rejects prequal | Backend | link_id, decision, score | Funnel | P0 |
| `vendor_awarded` | Buyer awards a vendor | Backend | link_id, request_id, vendor_id | Funnel | P0 |
| `full_pack_submitted` | Vendor submits full document pack | Backend | link_id, checklist_count | Funnel | P0 |
| `governance_decided` | Buyer decides a control function | Backend | link_id, stage, decision | Funnel | P0 |
| `contract_signed` | Either side signs a contract | Backend | contract_id, contract_type, side, link_id | Funnel | P0 |
| `contracts_finalised` | Buyer finalises all contracts | Backend | link_id, executed_count, total_count | Funnel | P0 |
| `erp_pushed` | Buyer pushes to ERP | Backend | link_id, vendor_code, total_days | Funnel | P0 |
| `vendor_onboarded` | Link reaches ONBOARDED | Backend | link_id, vendor_code, total_days, [stage_breakdown](#stage-breakdown) | Funnel | P0 |
| `signup_completed` | User completes signup | Frontend | tier, role | Funnel | P0 |
| `login_completed` | User logs in | Frontend | role | Funnel | P0 |
| `quotation_recorded` | Buyer saves a vendor quotation | Backend | request_id, vendor_id, landed_cost, lead_time_days | Engagement | P1 |
| `scoring_weights_adjusted` | Buyer moves weight slider | Frontend | request_id, quality, cost, delivery, risk | Engagement | P1 |
| `view_switched` | User switches drill-down / summary | Frontend | from_view, to_view, role, tier | Engagement | P1 |
| `vendor_drawer_opened` | Buyer clicks engagement badge | Frontend | link_id, vendor_name, link_state | Engagement | P1 |
| `vendor_progress_previewed` | Buyer clicks "Vendor view" | Frontend | link_id, vendor_name | Engagement | P1 |
| `directory_searched` | Buyer searches vendor directory | Frontend | search_term | Engagement | P1 |
| `sla_rule_updated` | Buyer saves SLA rule | Backend | stage, sla_days, escalate | Engagement | P1 |
| `team_member_added` | Buyer adds team member | Backend | role | Engagement | P1 |
| `vendor_detail_tab_switched` | Buyer switches vendor tab | Frontend | tab, vendor_id | Engagement | P1 |
| `prequal_form_started` | Vendor opens prequal page | Frontend | link_id | Retention | P1 |
| `capability_saved` | Vendor autosaves capability fields | Frontend | link_id, processes_count, certifications_count | Retention | P1 |
| `document_uploaded` | Vendor uploads a document | Backend | link_id, checklist_item_key, stage | Retention | P1 |
| `mobile_otp_requested` | Vendor starts mobile verification | Backend | user_id | Retention | P1 |
| `mobile_verified` | Vendor verifies OTP | Backend | user_id | Retention | P1 |
| `onboarding_form_submitted` | Vendor submits prequal or full pack | Frontend | link_id, stage, field_count, doc_count | Retention | P1 |
| `contract_change_requested` | Vendor requests contract changes | Backend | contract_id, contract_type | Retention | P1 |
| `contract_agreed` | Vendor agrees to contract | Backend | contract_id, contract_type | Retention | P1 |
| `verification_check_completed` | System resolves a check | Backend | link_id, check_type, status, match_score | Operational | P2 |
| `verification_overridden` | Buyer overrides a check | Backend | link_id, check_id, action, check_type | Operational | P2 |
| `invite_expired` | System: link reaches EXPIRED | Backend | link_id, request_id | Operational | P2 |
| `erp_push_failed` | System: link reaches ERP_FAILED | Backend | link_id | Operational | P2 |
| `join_gate_passed` | All contracts + approvals clear | Backend | link_id | Operational | P2 |
| `directory_vendor_promoted` | Vendor added to directory | Backend | vendor_email, badge_state | Operational | P2 |
| `landing_cta_clicked` | Visitor clicks CTA on landing page | Frontend | position | Adoption | P2 |
| `tier_selected` | User picks tier during signup | Frontend | tier | Adoption | P2 |

## Cross-Stack Pairs

Events that need both frontend and backend to work together.

| Pattern | Frontend event | Backend event | Glue |
|---|---|---|---|
| Form duration | `prequal_form_started` + `onboarding_form_submitted` ($duration) | `prequal_submitted` (stage_days) | link_id |
| Two-actor handoff | `invites_dispatched` (buyer) | `invite_redeemed` (vendor) + `prequal_decided` (buyer) | request_id |
| Journey duration | — | `vendor_onboarded` (total_days, stage_breakdown) | link_id |
| Feature adoption | `scoring_weights_adjusted` | `quotation_recorded` + `people.set_once(first_quotation_at)` | request_id |

## Stage Breakdown

The `vendor_onboarded` event includes a `stage_breakdown` object with days spent in each stage:

```json
{
  "prequal": 3,
  "award": 1,
  "full_pack": 5,
  "governance": 4,
  "contracts": 2,
  "erp": 1
}
```

Use this to build a bar chart in Mixpanel showing which stage is the bottleneck.

## Dashboard Mapping

| Board | Key events |
|---|---|
| Onboarding Funnel | All P0 funnel events in sequence |
| Buyer Engagement | scoring_weights_adjusted, quotation_recorded, view_switched, directory_searched |
| Vendor Experience | prequal_form_started, capability_saved, document_uploaded, onboarding_form_submitted |
| Governance & Compliance | governance_decided, verification_check_completed, verification_overridden, join_gate_passed |
| Executive Summary | vendor_onboarded (total_days trend), signup_completed, requirement_created |

## Implementation

1. Frontend: `import { track } from "@/lib/analytics.js"` then `track("event_name", { props })`
2. Backend: `import { trackServer } from "../lib/analytics.js"` then `trackServer("event_name", { distinct_id, ...props })`
3. Duration: call `mixpanel.time_event("event_name")` on start, `track("event_name")` on end
4. Profile counters: `mixpanel.people.increment("vendors_onboarded", 1)`
5. First-use: `mixpanel.people.set_once({ first_quotation_at: new Date().toISOString() })`
