import { useEffect, useRef, useState } from "react";
import { getMyTracker } from "../../lib/tracker-api.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";
import { Card, Spinner } from "../../components/ui.js";

interface TrackerData {
  whoseCourtIndicator: "VENDOR" | "BUYER" | "NEUTRAL";
  vendorWaitedDays: number;
  buyerPendingDays: number;
  buyerContactEmail?: string;
  buyerContactPhone?: string;
  milestones: Array<{
    id: string;
    name: string;
    status: "DONE" | "ACTIVE" | "PENDING";
    dueDate?: string;
  }>;
}

export function VendorStatusPage(): React.ReactElement {
  const [tracker, setTracker] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useTextReveal<HTMLHeadingElement>();
  const pollIntervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<number>(0);

  async function fetchTracker(): Promise<void> {
    try {
      const data = await getMyTracker();
      setTracker(data);
      setError(null);
      lastFetchRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracker");
    }
  }

  function startPolling(): void {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = window.setInterval(async () => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      if (timeSinceLastFetch >= 30000) {
        await fetchTracker();
      }
    }, 5000);
  }

  function stopPolling(): void {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  useEffect(() => {
    fetchTracker().finally(() => setLoading(false));

    const handleFocus = (): void => {
      startPolling();
      fetchTracker();
    };
    const handleBlur = (): void => {
      stopPolling();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    startPolling();

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      stopPolling();
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-16 grid place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error || !tracker) {
    return (
      <Card className="mt-8 p-8 text-center">
        <p className="text-sm text-rose-600">
          {error || "Failed to load tracker."}
        </p>
      </Card>
    );
  }

  const courtLabel =
    tracker.whoseCourtIndicator === "VENDOR"
      ? "Your turn"
      : tracker.whoseCourtIndicator === "BUYER"
        ? "Buyer's turn"
        : "Waiting";

  const courtColor =
    tracker.whoseCourtIndicator === "VENDOR"
      ? "text-amber-600"
      : tracker.whoseCourtIndicator === "BUYER"
        ? "text-blue-600"
        : "text-slate-600";

  return (
    <div>
      <h1
        ref={titleRef}
        className="text-3xl font-bold tracking-tight text-slate-900"
      >
        Onboarding status
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-sm text-slate-500">Whose court?</div>
          <div className={`mt-2 text-2xl font-bold ${courtColor}`}>
            {courtLabel}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">You've been waiting</span>
              <span className="font-semibold text-slate-900">
                {tracker.vendorWaitedDays} day{tracker.vendorWaitedDays !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Buyer is reviewing</span>
              <span className="font-semibold text-slate-900">
                {tracker.buyerPendingDays} day{tracker.buyerPendingDays !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {(tracker.buyerContactEmail || tracker.buyerContactPhone) && (
        <Card className="mt-6 p-6">
          <div className="text-sm font-medium text-slate-900">Buyer contact</div>
          <div className="mt-3 space-y-2">
            {tracker.buyerContactEmail && (
              <p className="text-sm text-slate-600">{tracker.buyerContactEmail}</p>
            )}
            {tracker.buyerContactPhone && (
              <p className="text-sm text-slate-600">{tracker.buyerContactPhone}</p>
            )}
          </div>
        </Card>
      )}

      {tracker.milestones && tracker.milestones.length > 0 && (
        <Card className="mt-6 p-6">
          <div className="text-sm font-medium text-slate-900 mb-4">
            Timeline ({tracker.milestones.length} milestones)
          </div>
          <div className="space-y-3">
            {tracker.milestones.map((m) => {
              const statusColor =
                m.status === "DONE"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : m.status === "ACTIVE"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600";

              return (
                <div
                  key={m.id}
                  className={`rounded-lg border p-3 ${statusColor}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs font-semibold">
                      {m.status === "DONE"
                        ? "✓ Done"
                        : m.status === "ACTIVE"
                          ? "→ Active"
                          : "○ Pending"}
                    </span>
                  </div>
                  {m.dueDate && (
                    <p className="mt-1 text-xs opacity-75">
                      Due: {new Date(m.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default VendorStatusPage;
