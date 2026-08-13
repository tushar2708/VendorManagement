# Cross-Stack Metric Patterns

When a metric needs both frontend and backend to work together. These patterns apply to any multi-session, multi-actor workflow — not just vendor onboarding.

## The core problem

Some metrics cannot live on one side alone:

- **Frontend alone fails** when the journey spans multiple sessions, devices, or days. `time_event()` resets when the tab closes.
- **Backend alone fails** when you need UX context: how long the user stared at the form, which device they used, what they clicked before submitting.
- **The answer is pairing**: frontend captures the user experience, backend captures the business outcome. Mixpanel merges them on `distinct_id`.

## Pattern 1: Journey Duration (multi-day, multi-session)

**Problem:** Measure elapsed time across a workflow that takes days or weeks (e.g., signup → onboarding complete, ticket opened → resolved, application submitted → approved).

**Wrong approach:**
```typescript
// Frontend — DOES NOT WORK for multi-day journeys
mixpanel.time_event("journey_completed");
// ... days pass, user closes browser, comes back ...
track("journey_completed"); // $duration is wrong or zero
```

**Correct approach — backend computed duration:**

```
Frontend                              Backend
────────                              ───────
User opens invite page                (nothing)
  track("invite_opened")

                                      User redeems invite
                                        DB: link.createdAt = now()

... days pass ...

User submits prequal form             
  track("prequal_submitted",          POST /api/vendor/prequal
    { form_duration_sec: 342 })         DB: update link state
                                        trackServer("prequal_submitted", {
                                          distinct_id, stage_days: 3
                                        })

... more days pass ...

                                      ERP push completes
                                        totalDays = floor((now - createdAt) / DAY)
                                        trackServer("vendor_onboarded", {
                                          distinct_id,
                                          total_days: totalDays,
                                          stage_breakdown: {
                                            prequal: 3, award: 1,
                                            full_pack: 5, governance: 4,
                                            contracts: 2, erp: 1
                                          }
                                        })
```

**What each side contributes:**

| Side | What it captures | Example properties |
|---|---|---|
| Frontend | Session-level UX timing | `form_duration_sec` (via `time_event`), `device`, `referrer` |
| Backend | Cross-session elapsed time | `total_days`, `stage_days`, `stage_breakdown` |

**Dashboard:** Insights report on `vendor_onboarded`, average of `total_days`, broken down by `vendor_type`. Bar chart of `stage_breakdown` values shows the bottleneck stage.

---

## Pattern 2: Per-Stage Milestone Tracking

**Problem:** A workflow has N stages. You want to know the conversion rate AND duration at each stage.

**Approach:** Emit a `stage_completed` event from the backend at each transition. The frontend tracks the user's entry into each stage.

```
Frontend                              Backend
────────                              ───────
User enters prequal form              
  track("stage_entered", {            
    stage: "PREQUAL",                 
    entry_source: "invite_link"       
  })                                  

                                      Prequal submitted + cleared
                                        trackServer("stage_completed", {
                                          distinct_id,
                                          stage: "PREQUAL",
                                          stage_duration_days: 3,
                                          cumulative_days: 3,
                                          outcome: "CLEARED",
                                          score: 82
                                        })

User opens full-pack page             
  track("stage_entered", {            
    stage: "FULL_PACK"                
  })                                  

                                      Full pack submitted
                                        trackServer("stage_completed", {
                                          distinct_id,
                                          stage: "FULL_PACK",
                                          stage_duration_days: 5,
                                          cumulative_days: 8,
                                          outcome: "SUBMITTED"
                                        })
```

**What each side contributes:**

| Side | Event | Purpose |
|---|---|---|
| Frontend | `stage_entered` | Marks when the user actually sees the stage (not just when the DB state changes) |
| Backend | `stage_completed` | Marks when the stage is done, with computed duration and outcome |

**Dashboard:** Funnel report using `stage_completed` events ordered by stage. Breakdown by `outcome` shows clear vs rejected rates. Average `stage_duration_days` by stage shows bottlenecks.

---

## Pattern 3: Form Experience + Business Outcome

**Problem:** A user fills a form (frontend). The form submission triggers a business process (backend). You want both the UX quality metrics and the business outcome in one picture.

**Approach:** Frontend tracks the form experience. Backend tracks what happened after.

```
Frontend                              Backend
────────                              ───────
Form opens                           
  mixpanel.time_event("form_submitted")
  track("form_opened", {              
    form_name: "prequal",             
    prefilled_fields: 2               
  })                                  

User fills fields                     
  (autocapture handles clicks)        

User hits submit                      
  track("form_submitted", {           POST /api/vendor/prequal
    form_name: "prequal",               runs verification checks
    field_count: 8,                     trackServer("prequal_processed", {
    document_count: 3,                    distinct_id,
    validation_errors: 0                  checks_passed: 3,
  })                                      checks_failed: 0,
  // $duration auto-attached              checks_review: 1,
  // (seconds from form_opened)           auto_advanced: false
                                        })
```

**What each side contributes:**

| Side | Metrics | Why it must be this side |
|---|---|---|
| Frontend | Form fill duration, field count, validation errors, device | Only the browser knows how long the user spent and what they saw |
| Backend | Check results, auto-advance decision, score | Only the server knows the verification outcome |

**Dashboard:** Two linked Insights reports. First: `form_submitted` average `$duration` by `form_name` (are forms too slow?). Second: `prequal_processed` breakdown by `checks_passed` vs `checks_failed` (is verification blocking people?).

---

## Pattern 4: Two-Actor Handoff (buyer + vendor)

**Problem:** Two different users act on the same entity. The buyer sends an invite, the vendor fills a form, the buyer reviews it. You want to track the handoff latency.

**Approach:** Both actors track events with the same `request_id` property. The backend computes handoff durations.

```
Buyer (Frontend)                      Backend
────────────────                      ───────
Buyer sends invite                    
  track("invite_dispatched", {        POST /api/requirements/:id/invites
    request_id, vendor_count: 3         trackServer("invite_dispatched", {
  })                                      distinct_id: buyerId,
                                          request_id,
                                          vendor_count: 3
                                        })

Vendor (Frontend)                     
────────────────                      
Vendor opens invite                   
  track("invite_opened", {           GET /api/invitations/:token
    request_id                          trackServer("invite_opened", {
  })                                      distinct_id: vendorId,
                                          request_id,
                                          days_since_dispatch: 2
                                        })

Vendor submits prequal                
  track("prequal_submitted", {        POST /api/vendor/prequal
    request_id                           trackServer("prequal_submitted", {
  })                                       distinct_id: vendorId,
                                           request_id,
                                           vendor_turnaround_days: 4
                                         })

Buyer (Frontend)                      
────────────────                      
Buyer reviews and clears              
  track("prequal_decided", {          POST /api/vendors/:id/prequal-decision
    request_id, decision: "CLEARED"      trackServer("prequal_decided", {
  })                                       distinct_id: buyerId,
                                           request_id,
                                           buyer_review_days: 2,
                                           decision: "CLEARED",
                                           score: 82
                                         })
```

**What each side contributes:**

| Side | What it captures | Key property |
|---|---|---|
| Frontend (buyer) | Buyer's click-level interactions | `request_id` ties all events together |
| Frontend (vendor) | Vendor's form experience | Same `request_id` |
| Backend | Handoff durations between actors | `days_since_dispatch`, `vendor_turnaround_days`, `buyer_review_days` |

**Dashboard:** Insights report on `prequal_decided`, average `buyer_review_days` over time. If it trends up, buyers are becoming a bottleneck. Funnel: `invite_dispatched` → `invite_opened` → `prequal_submitted` → `prequal_decided`, broken down by `request_id` to see per-request conversion.

---

## Pattern 5: Feature Adoption with UX Depth

**Problem:** You want to know if users adopt a feature AND how deeply they use it.

**Approach:** Frontend tracks interaction depth. Backend tracks the first-use timestamp.

```
Frontend                              Backend
────────                              ───────
User opens scoring panel              
  track("feature_opened", {           
    feature: "award_three_pane"       
  })                                  

User adjusts weight sliders           
  track("scoring_weights_adjusted", { 
    quality: 45, cost: 30,            
    delivery: 15, risk: 10            
  })                                  

User records a quotation              
  track("quotation_entered", {        PUT /api/requests/:id/quotations/:vid
    vendor_id, unit_price: 1200          trackServer("quotation_recorded", {
  })                                       distinct_id: buyerId,
                                           request_id,
                                           vendor_id,
                                           landed_cost: 1430
                                         })
                                         mp.people.set_once(buyerId, {
                                           first_quotation_at: new Date()
                                         })
                                         mp.people.increment(buyerId,
                                           "quotations_recorded", 1)

User awards a vendor                  
  track("vendor_awarded", {           POST /api/requests/:id/award
    vendor_id, used_scoring: true        trackServer("vendor_awarded", {
  })                                       distinct_id: buyerId,
                                           request_id,
                                           used_scoring: true,
                                           candidates_compared: 4
                                         })
```

**What each side contributes:**

| Side | Adoption signal | Depth signal |
|---|---|---|
| Frontend | `feature_opened` (did they even look?) | `scoring_weights_adjusted` (did they customize?) |
| Backend | `first_quotation_at` (when did they start?) | `quotations_recorded` count (how many did they enter?) |

**Dashboard:** Cohort analysis: users with `first_quotation_at` set (adopters) vs those without. Retention report: do scoring adopters return more often? Insights: average `quotations_recorded` per user.

---

## How to use these patterns in the skill

When the user describes a metric that involves multiple sessions, multiple actors, or a combination of UX + business data:

1. Identify which pattern fits (journey duration, per-stage, form+outcome, two-actor, adoption).
2. Show the user the paired frontend + backend events with the two-column diagram.
3. Explain what each side contributes and why it must be that side.
4. Generate both the frontend `track()` call and the backend `trackServer()` call.
5. Suggest the dashboard report that ties them together.

The `request_id` (or `link_id`, `vendor_id`) is the glue. Always include it as a property on both sides so Mixpanel can correlate the events across actors and sessions.
