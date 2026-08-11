# FRD 02 — Approver Queue and SLA Admin

## Page

| Field | Value |
|-------|-------|
| Route | `/approvals` |
| Screens | 1c (desktop), 1d (mobile) |
| Role | Buyer (approver) |

## Purpose

The approver views pending approvals sorted by SLA risk and configures SLA rules.

## Entry points

- The main navigation link "Approvals".
- A direct URL or bookmark to `/approvals`.
- A notification link from an overdue alert email.

## Exit points

- Click a table row to open the vendor detail view at `/dashboard?request={id}`.
- Click "Save rules" to persist SLA rule changes.

---

## Desktop layout (Screen 1c)

**Structure**: Main table area (flex 1) + right sidebar (260 px fixed).

### Header bar

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Page title | Heading (h1) | "Approver Queue" | Static | Read-only |
| User badge | Badge | "Jane R. . Legal" with user icon | Static | Shows the current approver name and stage |

### Main area

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Section title | Heading (h2) | "Pending (4)" | Dynamic count | Updates when the filter changes |
| Search input | Text input | "🔍 Search vendor…" | Empty by default | Filters the table rows |
| Sort dropdown | Select | "Sort: SLA risk" | Default selected | Options: SLA risk, Age, Vendor name |
| Filter badge: Overdue | Badge (red) | "Overdue (1)" with warning icon | Clickable | Filters to overdue rows only |
| Filter badge: At risk | Badge (amber) | "At risk (1)" | Clickable | Filters to at-risk rows only |
| Filter badge: On track | Badge (default) | "On track (2)" | Clickable | Filters to on-track rows only |
| Pending table | Table | 6 columns (see below) | Populated | Rows are clickable |
| Footer text | Text | "Showing 4 of 4 . sorted by risk, oldest first" | Dynamic | Updates with filter and sort state |

### Pending table columns

| Column | Type | Sort |
|--------|------|------|
| ID | String (`VR-NNNN`) | Sortable |
| Vendor | String | Sortable |
| Stage | String | Sortable |
| Age | String (`Nd`) | Sortable |
| SLA | String (`Nd`) | Sortable |
| Risk | Badge | Default sort (desc risk) |

### Pending table data

| ID | Vendor | Stage | Age | SLA | Risk | Row style |
|----|--------|-------|-----|-----|------|-----------|
| VR-2291 | Acme Fasteners | Legal | 6d | 3d | Overdue (red badge) | Amber bg `#fff3ea` |
| VR-2288 | Harbor Logistics | Finance | 5d | 3d | At risk (amber badge) | Default |
| VR-2294 | Bolt & Co | IT/Security | 2d | 4d | On track (green badge) | Default |
| VR-2279 | Zenith Tooling | Quality | 1d | 5d | On track (green badge) | Default |

### Right sidebar: SLA Rules

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Sidebar title | Heading (h3) | "SLA Rules" | Static | Read-only |
| Helper text | Text | "Days before a stage is flagged at-risk / overdue" | Static | Read-only |
| Finance SLA | Number input | "Finance: 3 days" | Editable | Accepts positive integers |
| Legal SLA | Number input | "Legal: 3 days" | Editable | Accepts positive integers |
| IT/Security SLA | Number input | "IT/Security: 4 days" | Editable | Accepts positive integers |
| Quality SLA | Number input | "Quality: 5 days" | Editable | Accepts positive integers |
| Escalation toggle | Toggle switch | "Escalate to manager after breach" | On by default | Toggles the escalation setting |
| Save rules button | Button (dark) | "Save rules" | Enabled when a value changes | Saves the SLA rules |

---

## Mobile layout (Screen 1d)

**Structure**: Single column, full width.

| Element | Type | Label / Value | State | Behavior |
|---------|------|---------------|-------|----------|
| Header | Heading | "My Queue (Legal)" | Static | Read-only |
| Filter badges | Horizontal scroll | Overdue, At risk, On track | Scrollable | Same filter behavior as desktop |
| Vendor card | Card | Vendor name (bold) + risk badge | Clickable | Opens the vendor detail |
| Card subtext | Text | "VR-xxxx . in queue Xd (SLA Xd)" | Static | Read-only |
| SLA settings link | Link | "SLA rule settings" with arrow | Enabled | Opens the SLA rules panel |

### Mobile card list

Each card shows:
- Vendor name in bold.
- Risk badge (same colors as desktop).
- Request ID, queue days, and SLA days.

---

## Data fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Request ID | String (format: `VR-NNNN`) | Auto-generated, unique | Yes |
| Vendor name | String | Max 200 characters | Yes |
| Stage | Enum: `finance`, `legal`, `it-security`, `quality` | Must match a pipeline step | Yes |
| Age (days) | Integer | Calculated: current date minus step start date | Derived |
| SLA (days) | Integer | Positive integer, set per stage | Yes |
| Risk level | Enum: `overdue`, `at-risk`, `on-track` | Derived from age and SLA | Derived |
| Approver name | String | Valid user reference | Yes |
| Approver stage | Enum: `finance`, `legal`, `it-security`, `quality` | Must match the approver assignment | Yes |
| Escalation enabled | Boolean | true or false | Yes |
| Finance SLA rule | Integer | Min 1, max 30 | Yes |
| Legal SLA rule | Integer | Min 1, max 30 | Yes |
| IT/Security SLA rule | Integer | Min 1, max 30 | Yes |
| Quality SLA rule | Integer | Min 1, max 30 | Yes |

## Status / state mapping

| Status value | Color | Meaning |
|--------------|-------|---------|
| Overdue | Red badge (`#d94f2b`), amber row bg (`#fff3ea`) | The step exceeded its SLA |
| At risk | Amber badge (`#c99a1e`) | The step is approaching its SLA |
| On track | Green badge (`#3f8f52`) | The step is within its SLA |

## Actions

| Button / Link | Trigger | Success state | Error state |
|---------------|---------|---------------|-------------|
| Filter badge (Overdue) | Click | Table shows only overdue rows | N/A |
| Filter badge (At risk) | Click | Table shows only at-risk rows | N/A |
| Filter badge (On track) | Click | Table shows only on-track rows | N/A |
| Sort dropdown | Change | Table re-sorts by the selected column | N/A |
| Table row | Click | Navigates to `/dashboard?request={id}` | Toast: "Failed to load request" |
| Save rules | Click | Toast: "SLA rules saved." Rules persist to database. | Toast: "Failed to save rules. Try again." |
| Escalation toggle | Toggle | Setting updates immediately | Toast: "Failed to update setting" |
| SLA settings link (mobile) | Click | Opens the SLA rules panel | N/A |

## Business rules

1. Calculate risk as follows:
   - Overdue: age > SLA days (e.g., 6d in queue vs 3d SLA = overdue by 3d).
   - At risk: age is within 1 day of SLA but not yet exceeded (e.g., 5d in queue vs 3d SLA can be "at risk" at the approver's discretion — thresholds are configurable).
   - On track: age is well within SLA days.
   - Note: the mock shows VR-2288 (age 5d, SLA 3d) as "At risk". The exact threshold formula is configurable via the SLA rules panel.
2. Sort by risk (default): overdue first, then at risk, then on track. Within the same risk level, sort by age descending (oldest first).
3. The filter badge counts update when the data changes.
4. The "Pending (N)" count reflects the total number of items, not the filtered count.
5. SLA rule changes apply to all future risk calculations. They do not change the SLA of items already in the queue.
6. When "Escalate to manager after breach" is on, the system sends an email to the approver's manager when a step becomes overdue.
7. Only users with the "approver" role can access this page.
8. Each approver sees only the items assigned to their stage.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| No pending items | Show: "No pending approvals. You are all caught up." |
| Search returns no results | Show: "No items match your search." |
| SLA rule set to 0 or negative | Show validation error: "SLA must be at least 1 day." |
| SLA rule exceeds 30 | Show validation error: "SLA must not exceed 30 days." |
| Network error on load | Show: "Could not load approvals. Click to retry." |
| Loading state | Show skeleton table rows and skeleton sidebar inputs. |
| Save rules with no changes | The "Save rules" button stays disabled. |
| Multiple filters active | Filters are exclusive. Only one filter badge is active at a time. Click a second badge to switch. |
