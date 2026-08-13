import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyLinks, type LinkSummary } from "../../lib/links-api.js";
import { getStatusLabel, getStatusVariant } from "../../lib/stage.js";
import { Badge } from "../../components/atoms/Badge.js";
import { Card, Spinner } from "../../components/ui.js";

function vendorRouteForState(state: string): string {
  if (["PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW", "PREQUAL_CLEARED", "INVITED"].includes(state)) return "/vendor/prequal";
  if (["FULL_IN_PROGRESS", "FULL_SUBMITTED", "FULL_UNDER_REVIEW", "AWARDED"].includes(state)) return "/vendor/full-pack";
  if (["CONTRACTS_IN_PROGRESS", "APPROVED"].includes(state)) return "/vendor/contract";
  if (state === "ONBOARDED") return "/vendor/complete";
  return "/vendor/prequal";
}

export function VendorDashboard(): React.ReactElement {
  const [links, setLinks] = useState<LinkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listMyLinks()
      .then((data) => {
        setLinks(data);
        if (data.length === 1) navigate(vendorRouteForState(data[0].state));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Your active engagements.</p>
      <div className="mt-6 space-y-3">
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => navigate(vendorRouteForState(l.state))}
            className="w-full text-left"
          >
            <Card className="p-4 cursor-pointer hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{l.requirementTitle}</span>
                <Badge variant={getStatusVariant(l.state)}>{getStatusLabel(l.state)}</Badge>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export default VendorDashboard;
