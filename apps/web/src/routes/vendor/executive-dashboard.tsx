import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVendorDashboardSummary, type DashboardLink } from "../../lib/vendor-api.js";
import { getStatusLabel, getStatusVariant } from "../../lib/stage.js";
import { errorMessage } from "../../lib/auth-api.js";
import { Badge } from "../../components/atoms/Badge.js";
import { CourtBadge } from "../../components/atoms/CourtBadge.js";
import { StatCard } from "../../components/molecules/StatCard.js";
import { ProgressDot } from "../../components/atoms/ProgressDot.js";
import { Card, Spinner, Button } from "../../components/ui.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";
import { useGridReveal } from "../../hooks/use-grid-reveal.js";

function vendorRouteForState(state: string): string {
  if (["PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW", "PREQUAL_CLEARED", "INVITED"].includes(state)) return "/vendor/prequal";
  if (["FULL_IN_PROGRESS", "FULL_SUBMITTED", "FULL_UNDER_REVIEW", "AWARDED"].includes(state)) return "/vendor/full-pack";
  if (["CONTRACTS_IN_PROGRESS", "APPROVED"].includes(state)) return "/vendor/contract";
  if (state === "ONBOARDED") return "/vendor/complete";
  return "/vendor/prequal";
}

interface Props {
  onSwitchToLeadership?: () => void;
}

export function VendorExecutiveDashboard({ onSwitchToLeadership }: Props): React.ReactElement {
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useTextReveal<HTMLHeadingElement>();
  const { ref: gridRef } = useGridReveal<HTMLDivElement>();

  useEffect(() => {
    getVendorDashboardSummary()
      .then(setLinks)
      .catch((e) => setError(errorMessage(e, "Could not load dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = links.filter(l => !["ONBOARDED", "REJECTED", "WITHDRAWN", "EXPIRED", "ON_HOLD"].includes(l.state)).length;
  const totalDocs = links.reduce((s, l) => s + l.documentsUploaded, 0);
  const totalDocsExpected = links.reduce((s, l) => s + l.documentsTotal, 0);
  const totalChecksPassed = links.reduce((s, l) => s + l.checksStatus.passed, 0);
  const totalChecks = links.reduce((s, l) => s + l.checksStatus.total, 0);

  if (loading) return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Vendor Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your active engagements and onboarding progress.</p>
        </div>
        {onSwitchToLeadership && (
          <Button variant="secondary" size="sm" onClick={onSwitchToLeadership}>Go to Summary</Button>
        )}
      </div>

      {error && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{error}</p>
        </Card>
      )}

      {!error && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Active" value={activeCount} />
            <StatCard label="Documents" value={totalDocsExpected > 0 ? `${totalDocs}/${totalDocsExpected}` : "—"} />
            <StatCard label="Checks passed" value={totalChecks > 0 ? `${totalChecksPassed}/${totalChecks}` : "—"} />
            <StatCard label="Completed" value={links.filter(l => l.state === "ONBOARDED").length} />
          </div>

          {links.length === 0 ? (
            <Card className="mt-8 grid place-items-center gap-3 p-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <p className="text-base font-semibold text-slate-900">No active engagements</p>
              <p className="max-w-sm text-sm text-slate-500">Once a buyer invites you to a requirement, your engagement will appear here.</p>
            </Card>
          ) : (
            <div ref={gridRef} className="mt-6 space-y-4">
              {links.map((link) => (
                <Link key={link.id} to={vendorRouteForState(link.state)} className="block">
                  <Card className="p-5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{link.requirementTitle}</span>
                          <Badge variant={getStatusVariant(link.state)}>{getStatusLabel(link.state)}</Badge>
                          <CourtBadge court={link.court} />
                        </div>

                        {/* Milestone rail */}
                        <div className="mt-3 flex items-center gap-1">
                          {link.milestones.map((m, idx) => (
                            <div key={m.key} className="flex items-center">
                              <ProgressDot state={m.state === "DONE" ? "done" : m.state === "CURRENT" ? "active" : "pending"} size="sm" />
                              {idx < link.milestones.length - 1 && (
                                <div className={`h-0.5 w-4 ${m.state === "DONE" ? "bg-emerald-400" : "bg-slate-200"}`} />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* TAT + contact */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>You: <strong className="text-slate-700">{link.tat.vendorPendingDays}d</strong></span>
                          <span>Buyer: <strong className="text-slate-700">{link.tat.buyerPendingDays}d</strong></span>
                          {link.contactName && <span>Contact: <strong className="text-slate-700">{link.contactName}</strong></span>}
                        </div>

                        {/* Quick stats row */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          <span>Docs: {link.documentsUploaded}/{link.documentsTotal}</span>
                          <span>Checks: {link.checksStatus.passed}/{link.checksStatus.total}</span>
                          {link.prequalScore != null && <span>Score: {link.prequalScore}</span>}
                          {link.erpVendorCode && <span>Code: {link.erpVendorCode}</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
