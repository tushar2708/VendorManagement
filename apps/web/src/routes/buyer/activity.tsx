import { useEffect, useState } from "react";
import type { ActivityItem } from "@vendor-management/shared";
import { getActivityFeed } from "../../lib/activity-api.js";
import { Card, Spinner } from "../../components/ui.js";
import { Badge } from "../../components/atoms/Badge.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";

export function ActivityPage(): React.ReactElement {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const headingRef = useTextReveal<HTMLHeadingElement>();

  function load() {
    getActivityFeed()
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const sideColor: Record<string, string> = {
    vendor: "bg-amber-400",
    buyer: "bg-blue-400",
    system: "bg-slate-400",
  };

  const categoryVariant: Record<string, "info" | "success" | "warning" | "neutral"> = {
    lifecycle: "info",
    approval: "success",
    contract: "warning",
    verification: "neutral",
  };

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Activity</h1>
      <p className="mt-1 text-sm text-slate-500">Real-time feed of all vendor onboarding events.</p>

      {loading && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}

      {!loading && activities.length === 0 && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-slate-500">No activity yet.</p>
        </Card>
      )}

      {!loading && activities.length > 0 && (
        <div className="mt-6 space-y-3">
          {activities.map((a) => (
            <Card key={a.id} className="flex items-start gap-3 p-4">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${sideColor[a.side] ?? "bg-slate-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {a.vendorName && <span className="text-sm font-medium text-slate-900">{a.vendorName}</span>}
                  <Badge variant={categoryVariant[a.category] ?? "neutral"}>{a.category}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{a.description}</p>
                {a.requirementTitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{a.requirementTitle}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
