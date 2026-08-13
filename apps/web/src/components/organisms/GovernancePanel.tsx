import { useEffect, useState } from "react";
import type { ControlFunction } from "@vendor-management/shared";
import { getControls } from "../../lib/controls-api.js";
import { summariseControls, controlFunctionLabels } from "../../lib/control-functions.js";
import { Button, Card, Spinner, cn } from "../ui.js";
import { Badge } from "../atoms/Badge.js";
import { ControlFunctionCard } from "../molecules/ControlFunctionCard.js";
import { ActivityItem } from "../molecules/ActivityItem.js";
import { useGridReveal } from "../../hooks/use-grid-reveal.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";

interface GovernancePanelProps {
  readonly vendorId: string;
  readonly linkId: string;
}

export function GovernancePanel({ vendorId, linkId }: GovernancePanelProps): React.ReactElement {
  const [controls, setControls] = useState<ControlFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ref: gridRef } = useGridReveal<HTMLDivElement>();
  const headingRef = useTextReveal<HTMLHeadingElement>();

  useEffect(() => {
    const fetchControls = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getControls(vendorId);
        setControls(data);
      } catch (err) {
        console.error("Failed to fetch controls:", err);
        setError(err instanceof Error ? err.message : "Failed to load governance controls");
      } finally {
        setLoading(false);
      }
    };

    fetchControls();
  }, [vendorId]);

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Spinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-rose-200 bg-rose-50/40">
        <p className="text-sm text-rose-800">{error}</p>
      </Card>
    );
  }

  const summary = summariseControls(controls);
  const toneToVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
    cleared: "success",
    blocked: "danger",
    review: "warning",
    info: "info",
    idle: "neutral",
  };

  return (
    <div className="space-y-6">
      <Card className={cn(
        "p-6 border-l-4",
        summary.tone === "cleared" && "bg-emerald-50/40 border-l-emerald-500",
        summary.tone === "blocked" && "bg-rose-50/40 border-l-rose-500",
        summary.tone === "review" && "bg-amber-50/40 border-l-amber-500",
        summary.tone === "info" && "bg-sky-50/40 border-l-sky-500",
        summary.tone === "idle" && "border-l-slate-300"
      )}>
        <div className="space-y-2">
          <h3 ref={headingRef} className="text-lg font-semibold text-slate-900">
            {summary.label}
          </h3>
          <p className="text-sm text-slate-600">{summary.detail}</p>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Control functions</h2>
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {controls.map((control) => (
            <ControlFunctionCard
              key={control.stage}
              control={control}
            />
          ))}
        </div>
      </div>

      {controls.length > 0 && (
        <>
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Evidence & verification</h2>
            <Card className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Verification checks</span>
                  <Badge variant="neutral">
                    {controls.filter(c => c.status === "IN_PROGRESS").length} in progress
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-slate-600">Document pack status</span>
                  <Badge variant={
                    controls.every(c => ["APPROVED", "EDD_COMPLETE"].includes(c.status))
                      ? "success"
                      : controls.some(c => c.status === "CHANGES_REQUESTED")
                        ? "danger"
                        : "info"
                  }>
                    {controls.filter(c => ["APPROVED", "EDD_COMPLETE"].includes(c.status)).length}
                    {" "}
                    of
                    {" "}
                    {controls.length} complete
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Activity trail</h2>
            <Card className="p-6">
              <div className="space-y-4">
                {controls
                  .filter(c => c.completedAt)
                  .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
                  .slice(0, 5)
                  .map((control, index) => (
                    <ActivityItem
                      key={control.stage}
                      action={controlFunctionLabels[control.stage]}
                      message={`Control decision recorded`}
                      timestamp={control.completedAt || new Date().toISOString()}
                      isLast={index === controls.length - 1}
                    />
                  ))}
                {controls.filter(c => c.completedAt).length === 0 && (
                  <p className="text-sm text-slate-500">No activity yet</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
