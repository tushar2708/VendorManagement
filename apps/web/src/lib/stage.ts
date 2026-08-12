import type { RequestStatus } from '@vendor-management/shared';

interface StatusStyle {
  readonly label: string;
  readonly badge: string;
  readonly dot: string;
}

export const STATUS_STYLE: Record<RequestStatus, StatusStyle> = {
  DRAFT: { label: 'Draft', badge: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  CANDIDATES_SELECTED: { label: 'Candidates selected', badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  INVITES_DISPATCHED: { label: 'Invites sent', badge: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  PREQUAL_IN_PROGRESS: { label: 'Pre-qualification in progress', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  PREQUAL_COMPLETE: { label: 'Pre-qualification complete', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  AWARDED: { label: 'Awarded', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  FULL_PACK_SUBMITTED: { label: 'Full pack submitted', badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  DEEP_VERIFICATION: { label: 'Deep verification', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  APPROVALS_IN_PROGRESS: { label: 'Approvals in progress', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  CONTRACT_REVIEW: { label: 'Contract review', badge: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  ERP_PUSH: { label: 'ERP push', badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
};
