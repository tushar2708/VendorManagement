import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Badge } from './atoms/Badge.js';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly size?: 'sm' | 'md';
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60 disabled:pointer-events-none';

const BUTTON_VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 motion-safe:active:scale-[0.98]',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-500 disabled:bg-rose-300',
};

const BUTTON_SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps): React.ReactElement {
  return <button className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)} {...props} />;
}

export function Card({ className, children }: { readonly className?: string; readonly children: ReactNode }): React.ReactElement {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>
  );
}

export function Spinner({ className }: { readonly className?: string }): React.ReactElement {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600',
        className,
      )}
    />
  );
}

export function Chip({ children }: { readonly children: ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export function statusTone(status: string | null | undefined): string {
  switch (status) {
    case "VERIFIED": case "PASSED": case "APPROVED": case "COMPLETED": case "ONBOARDED":
    case "VERIFICATION_PASSED": case "SHORTLISTED": case "EDD_COMPLETE": case "ACCEPTED":
      return "success";
    case "FAILED": case "REJECTED": case "ERP_FAILED": case "VERIFICATION_FAILED": case "BLOCKED":
      return "danger";
    case "PENDING": case "IN_PROGRESS": case "RUNNING": case "VERIFICATION_IN_PROGRESS":
    case "IN_APPROVAL": case "INFORMATION_REQUIRED":
      return "progress";
    case "NEEDS_REVIEW": case "CHANGES_REQUESTED": case "REQUESTED": case "IN_REVIEW":
    case "INFO_SUBMITTED": case "ONBOARDING":
      return "info";
    default:
      return "neutral";
  }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", INVITED: "Invited", PREQUAL_IN_PROGRESS: "Pre-qual in progress",
  PREQUAL_SUBMITTED: "Submitted", PREQUAL_UNDER_REVIEW: "Under review",
  PREQUAL_CLEARED: "Cleared", AWARDED: "Awarded", FULL_IN_PROGRESS: "Full pack in progress",
  FULL_SUBMITTED: "Full pack submitted", FULL_UNDER_REVIEW: "Full pack review",
  CONTRACTS_IN_PROGRESS: "Contracts", APPROVED: "Approved", ERP_SYNCING: "ERP syncing",
  ONBOARDED: "Onboarded", REJECTED: "Rejected", ON_HOLD: "On hold",
  WITHDRAWN: "Withdrawn", ERP_FAILED: "ERP failed", EXPIRED: "Expired",
  PASSED: "Passed", FAILED: "Failed", RUNNING: "Running", PENDING: "Pending",
  NEEDS_REVIEW: "Needs review", ACCEPTED: "Accepted",
  CREATED: "Not started", IN_PROGRESS: "In progress",
  INFO_SUBMITTED: "Information submitted",
  VERIFICATION_IN_PROGRESS: "Verification in progress",
  VERIFICATION_PASSED: "Checks passed",
  VERIFICATION_FAILED: "Verification failed",
  IN_APPROVAL: "Awaiting approvals",
  VERIFIED: "Verified",
  MISSING: "Missing", NOT_RUN: "Not verified yet",
  REQUESTED: "Requested", IN_REVIEW: "In review",
  SHORTLISTED: "Shortlisted", COMPLETED: "Completed", BLOCKED: "Blocked",
  ONBOARDING: "Onboarding",
  INFORMATION_REQUIRED: "Information required",
  EDD_COMPLETE: "EDD complete",
  CHANGES_REQUESTED: "Changes requested",
};

export function humanStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: string | null | undefined }): React.ReactElement {
  const tone = statusTone(status);
  const variant = tone === "success" ? "success" : tone === "danger" ? "danger" : tone === "progress" ? "warning" : tone === "info" ? "info" : "neutral";
  return <Badge variant={variant}>{humanStatus(status)}</Badge>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100", (props as any).className)}
    />
  );
}

export function ErrorText({ children }: { readonly children: ReactNode }): React.ReactElement {
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">{children}</p>;
}

export function ProgressPill({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <span className="text-sm text-slate-600">
      {label}: <strong className="text-slate-900">{done}</strong>/{total}
    </span>
  );
}
