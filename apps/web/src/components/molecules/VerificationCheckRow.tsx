import { CheckCircle2Icon, CircleAlertIcon, CircleDashedIcon, XCircleIcon } from "lucide-react";
import { CHECK_META } from "@vendor-management/shared";
import { Badge } from "../atoms/Badge.js";
import { Button } from "../ui.js";
import { cn } from "../ui.js";

interface VerificationCheckRowProps {
  readonly check: {
    readonly checkType: string;
    readonly status: string;
    readonly matchScore: number | null;
    readonly detail: unknown;
    readonly ranAt: string | null;
  };
  readonly onOverride?: (action: "accept" | "reject") => void;
}

const statusIconMap: Record<string, typeof CheckCircle2Icon> = {
  PASSED: CheckCircle2Icon,
  FAILED: XCircleIcon,
  NEEDS_REVIEW: CircleAlertIcon,
  RUNNING: CircleDashedIcon,
  ACCEPTED: CheckCircle2Icon,
  REJECTED: XCircleIcon,
};

const statusToneMap: Record<string, string> = {
  PASSED: "text-emerald-600",
  FAILED: "text-rose-600",
  NEEDS_REVIEW: "text-amber-600",
  RUNNING: "text-slate-500",
  ACCEPTED: "text-emerald-600",
  REJECTED: "text-rose-600",
};

const statusLabelMap: Record<string, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  NEEDS_REVIEW: "Needs review",
  RUNNING: "Running",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const statusVariantMap: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  PASSED: "success",
  FAILED: "danger",
  NEEDS_REVIEW: "warning",
  RUNNING: "neutral",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export function VerificationCheckRow({ check, onOverride }: VerificationCheckRowProps): React.ReactElement {
  const Icon = statusIconMap[check.status] || CircleDashedIcon;
  const tone = statusToneMap[check.status] || "text-muted-foreground";
  const label = statusLabelMap[check.status] || check.status;
  const variant = statusVariantMap[check.status] || "neutral";

  const checkLabel = (CHECK_META as Record<string, { label: string }>)[check.checkType]?.label || check.checkType;
  const showOverride = check.status === "NEEDS_REVIEW" && onOverride;
  const showMatchScore = check.matchScore !== null && check.status === "NEEDS_REVIEW";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", tone)} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{checkLabel}</p>
          {check.detail != null && (
            <p className="mt-0.5 text-xs text-slate-500">{String(check.detail)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showMatchScore && (
          <span className="text-xs font-medium tabular-nums text-slate-600">{check.matchScore}%</span>
        )}
        <Badge variant={variant}>{label}</Badge>
        {showOverride && (
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOverride("accept")}
              aria-label="Accept verification check"
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOverride("reject")}
              aria-label="Reject verification check"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
