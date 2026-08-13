import { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import { Modal } from "../Modal.js";
import { Card, Spinner } from "../ui.js";
import { cn } from "../ui.js";
import { getVendorTracker } from "../../lib/tracker-api.js";

interface Milestone {
  readonly key: string;
  readonly label: string;
  readonly state: "DONE" | "CURRENT" | "PENDING";
  readonly actor: string;
  readonly at: string | null;
}

interface TrackerData {
  readonly requestNumber: string;
  readonly category: string;
  readonly youWaitedDays: number;
  readonly buyerPendingDays: number;
  readonly milestones: readonly Milestone[];
}

interface VendorProgressPreviewProps {
  readonly vendorId: string;
  readonly open: boolean;
  readonly onClose: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

const ACTOR_LABEL: Record<string, string> = {
  YOU: "vendor",
  VENDOR: "vendor",
  BUYER: "buyer",
  PLATFORM: "platform",
  SYSTEM: "system",
};

function Milestone({ milestone, last }: { readonly milestone: Milestone; readonly last: boolean }): React.ReactElement {
  const done = milestone.state === "DONE";
  const current = milestone.state === "CURRENT";

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
            done && "border-emerald-300 bg-emerald-50 text-emerald-700",
            current && "border-indigo-400 bg-indigo-50 text-indigo-700",
            !done && !current && "border-slate-300 bg-slate-50 text-slate-400",
          )}
        >
          {done ? <CheckIcon className="size-3.5" /> : current ? "●" : ""}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-slate-200" />}
      </div>
      <div className="pb-5">
        <p className={cn("text-sm font-medium", done || current ? "text-slate-900" : "text-slate-500")}>
          {milestone.label}
        </p>
        <p className="text-xs text-slate-500">
          {milestone.at
            ? `${formatDay(milestone.at)} · ${ACTOR_LABEL[milestone.actor] ?? milestone.actor.toLowerCase()}`
            : current
              ? `In progress · ${ACTOR_LABEL[milestone.actor] ?? milestone.actor.toLowerCase()}`
              : "Pending"}
        </p>
      </div>
    </li>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function VendorProgressPreview({ vendorId, open, onClose }: VendorProgressPreviewProps): React.ReactElement | null {
  const [tracker, setTracker] = useState<TrackerData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!open) return;

    setIsPending(true);
    setError(null);
    setTracker(null);

    getVendorTracker(vendorId)
      .then((data) => {
        setTracker(data);
        setIsPending(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to load vendor tracker"));
        setIsPending(false);
      });
  }, [vendorId, open]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vendor Onboarding Progress"
      maxWidth="max-w-2xl"
    >
      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-slate-600">Loading vendor progress…</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-slate-300 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            This vendor has not started onboarding yet, or progress data is unavailable.
          </p>
        </Card>
      ) : tracker ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Reference" value={tracker.requestNumber} />
            <Stat label="Category" value={tracker.category} />
            <Stat label="Vendor Waited" value={`${tracker.youWaitedDays}d`} />
            <Stat label="Buyer Pending" value={`${tracker.buyerPendingDays}d`} />
          </div>

          <Card className="border-slate-200 p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Progress Timeline
            </h3>
            <ol className="space-y-1">
              {tracker.milestones.map((milestone, index) => (
                <Milestone
                  key={milestone.key}
                  milestone={milestone}
                  last={index === tracker.milestones.length - 1}
                />
              ))}
            </ol>
          </Card>

          <p className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block size-3.5 rounded-full border-2 border-slate-300" />
            This is the vendor&apos;s view of their progress. Changes made here by the vendor will update their dashboard in real time.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
