# Mixpanel Dashboards Guide

After metrics are implemented, help the user create Mixpanel dashboards (called "Boards") to visualize them. This document covers the four core report types, how to organize boards, and dashboard recipes for common use cases.

## Mixpanel report types

Mixpanel has four core report types. Each answers a different question.

| Report type | Question it answers | When to use |
|---|---|---|
| **Insights** | "How many times did X happen?" | Counts, totals, averages, trends over time. The most common report. |
| **Funnels** | "What % of users complete steps A → B → C?" | Conversion rates through an ordered sequence of events. |
| **Retention** | "Do users come back after doing X?" | Repeat behavior. Day-N or week-N return rates. |
| **Flows** | "What do users do before/after X?" | Path analysis. Discover unexpected user journeys. |

## How to create a board

Boards are created in the Mixpanel web UI, not via code. The skill's job is to tell the user WHAT to put on each board, not to create the board itself.

### Steps:
1. Go to mixpanel.com → your project → "Boards" in the left sidebar.
2. Click "+ New Board" → name it.
3. Click "+ Add" → choose a report type (Insights, Funnels, Retention, Flows).
4. Configure the report with the events and properties you tracked.
5. Save the report to the board.
6. Repeat for each report.
7. Add text cards between reports to explain what the user is looking at.

## Dashboard recipes

### Recipe 1: Onboarding Funnel Board

**Purpose:** Track the end-to-end vendor onboarding conversion rate.

**Reports to add:**

1. **Funnel: Invite → Onboarded**
   - Type: Funnel
   - Steps (in order):
     1. `invite_opened`
     2. `prequal_submitted`
     3. `prequal_cleared`
     4. `vendor_awarded`
     5. `full_pack_submitted`
     6. `governance_cleared`
     7. `contracts_executed`
     8. `erp_pushed`
   - Breakdown by: `vendor_type` (PRODUCTION_PART vs INDIRECT_SERVICES)
   - Conversion window: 90 days

2. **Insight: Average onboarding days**
   - Type: Insights
   - Event: `vendor_onboarded` (or `erp_pushed`)
   - Metric: Average of `total_days` property
   - Time: Last 90 days, weekly

3. **Insight: Stage duration breakdown**
   - Type: Insights
   - Event: `stage_completed`
   - Metric: Average of `stage_duration_days`
   - Breakdown by: `stage` property
   - Visualization: Bar chart

4. **Insight: Drop-off reasons**
   - Type: Insights
   - Events: `prequal_rejected`, `invite_expired`, `vendor_withdrawn`
   - Metric: Total count
   - Breakdown by: event name

### Recipe 2: Buyer Engagement Board

**Purpose:** Track how actively buyers use the platform.

**Reports to add:**

1. **Insight: Weekly active buyers**
   - Event: Any event where `role = BUYER`
   - Metric: Unique users
   - Time: Last 12 weeks, weekly

2. **Insight: Requirements created per week**
   - Event: `requirement_created`
   - Metric: Total count
   - Time: Last 12 weeks, weekly

3. **Insight: Most used features**
   - Events: `requirement_created`, `candidate_shortlisted`, `invite_dispatched`, `scoring_weights_adjusted`, `control_decided`, `contract_signed`
   - Metric: Total count per event
   - Visualization: Bar chart

4. **Retention: Do buyers return weekly?**
   - Type: Retention
   - First event: `requirement_created`
   - Return event: Any event
   - Retention window: Weekly, 8 weeks

### Recipe 3: Vendor Experience Board

**Purpose:** Track the vendor-side experience and bottlenecks.

**Reports to add:**

1. **Insight: Vendor waiting time**
   - Event: `stage_completed`
   - Metric: Average of `buyer_pending_days` property
   - Breakdown by: `stage`
   - This shows where buyers are slow to act.

2. **Funnel: Vendor completion rate**
   - Steps: `invite_opened` → `prequal_submitted` → `full_pack_submitted` → `contracts_signed` → `vendor_onboarded`
   - Conversion window: 60 days

3. **Insight: Document upload rate**
   - Event: `document_uploaded`
   - Breakdown by: `checklist_code` property
   - Shows which documents vendors struggle with.

4. **Insight: Verification outcomes**
   - Event: `verification_check_completed`
   - Breakdown by: `status` (PASSED / FAILED / NEEDS_REVIEW)
   - Shows pre-qual quality.

### Recipe 4: Governance & Compliance Board

**Purpose:** Track the 8 control functions and SLA compliance.

**Reports to add:**

1. **Insight: Controls cleared per week**
   - Event: `control_decided`
   - Filter: `decision = APPROVED` or `decision = EDD_COMPLETE`
   - Metric: Total count
   - Breakdown by: `stage` property

2. **Insight: SLA compliance rate**
   - Event: `control_decided`
   - Metric: Percentage where `within_sla = true`
   - Time: Last 12 weeks, weekly

3. **Insight: Average clearance time by control**
   - Event: `control_decided`
   - Metric: Average of `days_to_decide` property
   - Breakdown by: `stage`

4. **Insight: Bottleneck control**
   - Event: `control_decided`
   - Metric: Count where `days_to_decide > sla_target`
   - Breakdown by: `stage`
   - Shows which control function most often exceeds SLA.

### Recipe 5: Executive Summary Board

**Purpose:** A leadership-level overview of the entire platform.

**Reports to add:**

1. **Insight: Total vendors onboarded (cumulative)**
   - Event: `vendor_onboarded`
   - Metric: Total count, cumulative
   - Time: Last 6 months, monthly

2. **Insight: Average onboarding days (trend)**
   - Event: `vendor_onboarded`
   - Metric: Average of `total_days`
   - Time: Last 6 months, monthly

3. **Insight: Active users (buyers + vendors)**
   - Event: Any event
   - Metric: Unique users
   - Breakdown by: `role`
   - Time: Last 12 weeks, weekly

4. **Funnel: End-to-end conversion**
   - Same as Recipe 1, Funnel 1

5. **Insight: Revenue impact (if billing tracked)**
   - Event: `payment_completed` (if exists)
   - Metric: Sum of `amount`

## Board organization tips

- Name boards with the audience: "Exec Summary", "Buyer Ops", "Vendor Experience", "Compliance".
- Pin the most important board as your team's default.
- Use text cards between reports to add context (e.g., "This funnel measures the happy path. Rejected vendors are excluded.").
- Set board-level date ranges to "Last 30 days" for operational boards and "Last 6 months" for executive boards.
- Share boards with the right permission level: Viewers for stakeholders, Editors for analysts.

## Mixpanel templates

Mixpanel offers built-in templates for common use cases. Check "Templates" in the Boards section for:
- Product overview
- User acquisition
- Engagement
- Retention

These are pre-built and customizable. Start with a template if it fits, then modify the events to match your project.

## Official documentation

- [Boards overview](https://docs.mixpanel.com/docs/boards)
- [Creating boards guide](https://docs.mixpanel.com/guides/guides-by-topic/core-reports/create-boards)
- [Sharing and permissions](https://docs.mixpanel.com/docs/boards/sharing-and-permission)
- [Boards on boards (enterprise)](https://docs.mixpanel.com/docs/boards/boards-on-boards)
