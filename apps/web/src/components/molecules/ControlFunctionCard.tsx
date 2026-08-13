import type { ControlFunction, ApprovalStage } from "@vendor-management/shared";
import { controlFunctionLabels, controlFunctionScopes, controlStatusLabels, controlStatusTone } from "../../lib/control-functions.js";
import { Badge } from "../atoms/Badge.js";
import { Button, Card, cn } from "../ui.js";

interface ControlFunctionCardProps {
  readonly control: ControlFunction;
  readonly onDecide?: (stage: ApprovalStage) => void;
}

const toneToVariant: Record<ReturnType<typeof controlStatusTone>, "success" | "warning" | "danger" | "info" | "neutral"> = {
  cleared: "success",
  blocked: "danger",
  review: "warning",
  info: "info",
  idle: "neutral",
};

export function ControlFunctionCard({ control, onDecide }: ControlFunctionCardProps): React.ReactElement {
  const tone = controlStatusTone(control.status);
  const variant = toneToVariant[tone];
  const label = controlFunctionLabels[control.stage];
  const scope = controlFunctionScopes[control.stage];
  const statusLabel = controlStatusLabels[control.status];

  return (
    <Card className={cn(
      "p-4 transition-all hover:shadow-md border-l-4",
      tone === "cleared" && "border-l-emerald-500",
      tone === "blocked" && "border-l-rose-500",
      tone === "review" && "border-l-amber-500",
      tone === "info" && "border-l-sky-500",
      tone === "idle" && "border-l-slate-300"
    )}>
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
          <p className="mt-1 text-xs text-slate-600">{scope}</p>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={variant}>{statusLabel}</Badge>
          {onDecide && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDecide(control.stage)}
            >
              Review
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
