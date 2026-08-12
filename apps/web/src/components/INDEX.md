# Component Inventory — Atomic Design

## Atoms

Smallest UI elements. No business logic. Purely visual.

| Component | File | Props | Used by |
|---|---|---|---|
| `Icon` | `atoms/Icon.tsx` | name, size, className | NavItem, Badge, buttons |
| `Badge` | `atoms/Badge.tsx` | variant (success/warning/danger/info/neutral), children | Status tags, verified badges |
| `Avatar` | `atoms/Avatar.tsx` | name, size (sm/md/lg), className | Sidebar header, candidate rows |
| `ProgressDot` | `atoms/ProgressDot.tsx` | state (done/active/pending), size | PipelineStep |
| `Toggle` | `atoms/Toggle.tsx` | checked, onChange, label | SlaRuleRow (escalation) |
| `RangeSlider` | `atoms/RangeSlider.tsx` | value, min, max, onChange, label, showValue | CriteriaWeight |
| `ScoreBar` | `atoms/ScoreBar.tsx` | value (0-100), label, color | Scoring breakdown |
| `Shimmer` | `atoms/Shimmer.tsx` | width, height, className | Loading skeletons |
| `Tooltip` | `atoms/Tooltip.tsx` | content, children, side (top/bottom/left/right) | Pipeline steps, score explanations, SLA risk |
| `Toast` | `atoms/Toast.tsx` | message, variant (success/error/info), onClose | Global notifications via `useToast` hook |

Existing atoms (in `ui.tsx`, to extract):
- `Button` — already exists
- `Card` — already exists
- `Spinner` — already exists
- `Chip` — already exists

## Molecules

Combine atoms into small functional units.

| Component | File | Atoms used | Used by |
|---|---|---|---|
| `StatCard` | `molecules/StatCard.tsx` | Card | StatsBar |
| `PipelineStep` | `molecules/PipelineStep.tsx` | ProgressDot, Icon | PipelineStepper |
| `FilterChip` | `molecules/FilterChip.tsx` | Badge | Dashboard, Approvals |
| `NavItem` | `molecules/NavItem.tsx` | Icon | Sidebar |
| `SearchBar` | `molecules/SearchBar.tsx` | Icon, InputField | VendorList, ApprovalQueue |
| `VendorRow` | `molecules/VendorRow.tsx` | Badge, Icon | VendorList |
| `CandidateRow` | `molecules/CandidateRow.tsx` | Badge, Avatar, Button | CandidateTable |
| `ApprovalRow` | `molecules/ApprovalRow.tsx` | Badge, Button | ApprovalQueue |
| `SlaRuleRow` | `molecules/SlaRuleRow.tsx` | Toggle, Button | SlaSettingsTable |
| `ActivityItem` | `molecules/ActivityItem.tsx` | Icon, Badge | ActivityTimeline |
| `CriteriaWeight` | `molecules/CriteriaWeight.tsx` | RangeSlider | ScoringPanel |
| `VerificationRow` | `molecules/VerificationRow.tsx` | Icon, Badge | VerificationChecksCard |
| `EmptyState` | `molecules/EmptyState.tsx` | Icon, Button | Approvals, directory, dashboard |
| `RequestCard` | `molecules/RequestCard.tsx` | Card, Badge, MiniPipeline | Dashboard |
| `MiniPipeline` | `molecules/MiniPipeline.tsx` | ProgressDot | RequestCard (dashboard cards) |
| `ConfirmDialog` | `molecules/ConfirmDialog.tsx` | Modal, Button | Approve/reject, award, remove actions |
| `DocumentUploadRow` | `molecules/DocumentUploadRow.tsx` | Badge, Icon, Button | DocumentUploadGroup (vendor) |
| `RedlineComment` | `molecules/RedlineComment.tsx` | Avatar, Badge | ContractViewer (vendor) |

Existing molecules (to refactor from current files):
- `StageBadge` in `ui.tsx` — move to molecules
- `RequirementCard` — rename to RequestCard, add MiniPipeline (NOT PipelineStepper organism)

## Organisms

Larger sections combining molecules. Business-aware.

| Component | File | Molecules used | Used by |
|---|---|---|---|
| `Sidebar` | `organisms/Sidebar.tsx` | NavItem, Avatar | BuyerLayout |
| `HeaderBar` | `organisms/HeaderBar.tsx` | Avatar, Badge | BuyerLayout |
| `StatsBar` | `organisms/StatsBar.tsx` | StatCard | DashboardTemplate |
| `PipelineStepper` | `organisms/PipelineStepper.tsx` | PipelineStep | RequestCard, DetailTemplate |
| `CandidateTable` | `organisms/CandidateTable.tsx` | CandidateRow, SearchBar | DetailTemplate |
| `VendorList` | `organisms/VendorList.tsx` | VendorRow, SearchBar | DirectoryTemplate |
| `VendorIdentityCard` | `organisms/VendorIdentityCard.tsx` | Card | VendorDetailTemplate |
| `CertificationsCard` | `organisms/CertificationsCard.tsx` | Card, Chip | VendorDetailTemplate |
| `VerificationChecksCard` | `organisms/VerificationChecksCard.tsx` | VerificationRow, Card | VendorDetailTemplate |
| `ApprovalQueue` | `organisms/ApprovalQueue.tsx` | ApprovalRow, FilterChip, EmptyState | ApprovalsTemplate |
| `SlaSettingsTable` | `organisms/SlaSettingsTable.tsx` | SlaRuleRow, Card | SlaTemplate |
| `ScoringPanel` | `organisms/ScoringPanel.tsx` | CriteriaWeight, ScoreBar, Card | ScoreAwardTemplate |
| `ActivityTimeline` | `organisms/ActivityTimeline.tsx` | ActivityItem, Card | DetailTemplate |
| `QuickShortlistForm` | `organisms/QuickShortlistForm.tsx` | Button, InputField | DetailTemplate |
| `DocumentUploadGroup` | `organisms/DocumentUploadGroup.tsx` | DocumentUploadRow, Card | Vendor full-pack page |
| `ContractViewer` | `organisms/ContractViewer.tsx` | RedlineComment, Card, Button | Vendor contract page |
| `AddCandidateModal` | `organisms/AddCandidateModal.tsx` | Modal, SearchBar, VendorRow, Button | RequirementDetailTemplate (existing, reclassified) |
| `EditCandidateModal` | `organisms/EditCandidateModal.tsx` | Modal, Button | RequirementDetailTemplate (existing, reclassified) |
| `SendInvitesModal` | `organisms/SendInvitesModal.tsx` | Modal, Button, Badge | RequirementDetailTemplate (existing, reclassified) |

## Templates

Page-level layout structures. No data fetching — receive props.

| Template | File | Organisms used |
|---|---|---|
| `DashboardTemplate` | `templates/DashboardTemplate.tsx` | StatsBar, PipelineStepper (in RequestCard), FilterChip |
| `DirectoryTemplate` | `templates/DirectoryTemplate.tsx` | VendorList |
| `VendorDetailTemplate` | `templates/VendorDetailTemplate.tsx` | VendorIdentityCard, CertificationsCard, VerificationChecksCard |
| `RequirementDetailTemplate` | `templates/RequirementDetailTemplate.tsx` | PipelineStepper, CandidateTable, QuickShortlistForm, ActivityTimeline |
| `ApprovalsTemplate` | `templates/ApprovalsTemplate.tsx` | ApprovalQueue |
| `SlaTemplate` | `templates/SlaTemplate.tsx` | SlaSettingsTable |
| `ScoreAwardTemplate` | `templates/ScoreAwardTemplate.tsx` | ScoringPanel, CandidateTable |
| `VendorDashboardTemplate` | `templates/VendorDashboardTemplate.tsx` | PipelineStepper, EmptyState |
| `PrequalTemplate` | `templates/PrequalTemplate.tsx` | Card, VerificationRow |
| `FullPackTemplate` | `templates/FullPackTemplate.tsx` | DocumentUploadGroup |
| `VendorContractTemplate` | `templates/VendorContractTemplate.tsx` | ContractViewer |
| `VendorProfileTemplate` | `templates/VendorProfileTemplate.tsx` | VendorIdentityCard, CertificationsCard |

## Pages

Data-fetching layer. Connect to APIs. Pass data to templates.

| Page | File | Template | API endpoints |
|---|---|---|---|
| Dashboard | `routes/buyer/dashboard.tsx` | DashboardTemplate | GET /api/requirements, GET /api/requirements/stats |
| Vendor Directory | `routes/buyer/vendor-directory.tsx` | DirectoryTemplate | GET /api/directory |
| Vendor Detail | `routes/buyer/vendor-detail.tsx` | VendorDetailTemplate | GET /api/directory/:id |
| Requirement Detail | `routes/buyer/requirement-detail.tsx` | RequirementDetailTemplate | GET /api/requirements/:id, GET /api/requirements/:id/activity |
| Approvals | `routes/buyer/approvals.tsx` | ApprovalsTemplate | GET /api/approvals |
| SLA Settings | `routes/buyer/sla-settings.tsx` | SlaTemplate | GET /api/sla-rules, PATCH /api/sla-rules/:id |
| Score & Award | `routes/buyer/score-award.tsx` | ScoreAwardTemplate | GET /api/requirements/:id/scoring, POST /api/requirements/:id/award |
| Vendor Dashboard | `routes/vendor/dashboard.tsx` | VendorDashboardTemplate | GET /api/vendor/onboarding |
| Invite Landing | `routes/invite.tsx` | — (standalone) | POST /api/invite/:token/register |
| Pre-qualification | `routes/vendor/prequal.tsx` | PrequalTemplate | POST /api/vendor/prequal |
| Document Upload | `routes/vendor/full-pack.tsx` | FullPackTemplate | POST /api/vendor/documents |
| Contract Review | `routes/vendor/contract.tsx` | VendorContractTemplate | GET /api/vendor/contract, POST /api/vendor/contract/sign |
| Vendor Profile | `routes/vendor/profile.tsx` | VendorProfileTemplate | GET /api/vendor/profile |
| Onboarding Complete | `routes/vendor/complete.tsx` | — (simple success) | — |

## Folder Structure

```
apps/web/src/components/
├── atoms/
│   ├── Icon.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── ProgressDot.tsx
│   ├── Toggle.tsx
│   ├── RangeSlider.tsx
│   ├── ScoreBar.tsx
│   └── Shimmer.tsx
├── molecules/
│   ├── StatCard.tsx
│   ├── PipelineStep.tsx
│   ├── FilterChip.tsx
│   ├── NavItem.tsx
│   ├── SearchBar.tsx
│   ├── VendorRow.tsx
│   ├── CandidateRow.tsx
│   ├── ApprovalRow.tsx
│   ├── SlaRuleRow.tsx
│   ├── ActivityItem.tsx
│   ├── CriteriaWeight.tsx
│   ├── VerificationRow.tsx
│   ├── EmptyState.tsx
│   └── RequestCard.tsx
├── organisms/
│   ├── Sidebar.tsx
│   ├── HeaderBar.tsx
│   ├── StatsBar.tsx
│   ├── PipelineStepper.tsx
│   ├── CandidateTable.tsx
│   ├── VendorList.tsx
│   ├── VendorIdentityCard.tsx
│   ├── CertificationsCard.tsx
│   ├── VerificationChecksCard.tsx
│   ├── ApprovalQueue.tsx
│   ├── SlaSettingsTable.tsx
│   ├── ScoringPanel.tsx
│   ├── ActivityTimeline.tsx
│   └── QuickShortlistForm.tsx
├── templates/
│   ├── DashboardTemplate.tsx
│   ├── DirectoryTemplate.tsx
│   ├── VendorDetailTemplate.tsx
│   ├── RequirementDetailTemplate.tsx
│   ├── ApprovalsTemplate.tsx
│   ├── SlaTemplate.tsx
│   └── ScoreAwardTemplate.tsx
├── layout/
│   ├── buyer-layout.tsx (existing, rewrite sidebar)
│   └── vendor-layout.tsx (existing)
├── animmaster/ (GSAP-converted components)
│   └── DRIVE_IDS.md
├── ui.tsx (existing atoms — gradually refactor into atoms/)
├── Modal.tsx (existing)
├── AddCandidateModal.tsx (existing)
├── EditCandidateModal.tsx (existing)
├── SendInvitesModal.tsx (existing)
└── INDEX.md (this file)
```
