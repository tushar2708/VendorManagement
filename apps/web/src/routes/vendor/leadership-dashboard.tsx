import { useEffect, useState } from "react";
import { getVendorAnalytics, type VendorAnalytics, getVendorDashboardSummary, type DashboardLink } from "../../lib/vendor-api.js";
import { errorMessage } from "../../lib/auth-api.js";
import { getStatusLabel } from "../../lib/stage.js";
import { Card, Spinner, Button } from "../../components/ui.js";
import { StatCard } from "../../components/molecules/StatCard.js";
import { DonutChart } from "../../components/atoms/DonutChart.js";
import { HBarChart } from "../../components/atoms/HBarChart.js";
import { CourtBadge } from "../../components/atoms/CourtBadge.js";
import { Badge } from "../../components/atoms/Badge.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";
import { LINK_STATE_META } from "@vendor-management/shared";

interface Props {
  onSwitchToExecutive?: () => void;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; analytics: VendorAnalytics; links: DashboardLink[] };

export function VendorLeadershipDashboard({ onSwitchToExecutive }: Props): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const headingRef = useTextReveal<HTMLHeadingElement>();

  useEffect(() => {
    Promise.all([getVendorAnalytics(), getVendorDashboardSummary()])
      .then(([analytics, links]) => setState({ kind: "ready", analytics, links }))
      .catch((e: unknown) => setState({ kind: "error", message: errorMessage(e, "Could not load analytics.") }));
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Vendor Summary</h1>
          <p className="mt-1 text-sm text-slate-500">High-level overview of your onboarding engagements.</p>
        </div>
        {onSwitchToExecutive && (
          <Button variant="secondary" size="sm" onClick={onSwitchToExecutive}>Go to Drill-Down View</Button>
        )}
      </div>

      {state.kind === "loading" && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}

      {state.kind === "error" && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
        </Card>
      )}

      {state.kind === "ready" && (
        <>
          {/* KPI tiles */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Active" value={state.analytics.activeEngagements} />
            <StatCard label="Completed" value={state.analytics.completedEngagements} />
            <StatCard label="Avg days" value={state.analytics.avgDaysPerEngagement > 0 ? `${state.analytics.avgDaysPerEngagement}d` : "—"} />
            <StatCard label="Check pass rate" value={`${state.analytics.checksPassedRate}%`} />
            <StatCard label="Documents" value={`${state.analytics.documentsUploaded}/${state.analytics.documentsUploaded + state.analytics.documentsOutstanding}`} />
          </div>

          {/* Charts row */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Stage Distribution</h2>
              <p className="mt-1 text-sm text-slate-500">Engagements by current onboarding stage</p>
              <HBarChart
                className="mt-4"
                data={Object.entries(state.analytics.stageDistribution).map(([name, value]) => ({
                  name: LINK_STATE_META[name]?.label ?? name,
                  value,
                }))}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Document Compliance</h2>
              <p className="mt-1 text-sm text-slate-500">Upload progress across all engagements</p>
              <DonutChart
                className="mt-4"
                data={[
                  { name: "Uploaded", value: state.analytics.documentsUploaded, color: "#10b981" },
                  { name: "Outstanding", value: state.analytics.documentsOutstanding, color: "#e5e7eb" },
                ]}
              />
            </Card>
          </div>

          {/* Progress bars row */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Governance Progress</h2>
              <p className="mt-1 text-sm text-slate-500">{state.analytics.controlsCleared} of {state.analytics.controlsTotal} controls cleared</p>
              <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: state.analytics.controlsTotal > 0 ? `${(state.analytics.controlsCleared / state.analytics.controlsTotal) * 100}%` : "0%" }}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Contract Execution</h2>
              <p className="mt-1 text-sm text-slate-500">{state.analytics.contractsExecuted} of {state.analytics.contractsTotal} contracts executed</p>
              <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: state.analytics.contractsTotal > 0 ? `${(state.analytics.contractsExecuted / state.analytics.contractsTotal) * 100}%` : "0%" }}
                />
              </div>
            </Card>
          </div>

          {/* Engagements table */}
          <Card className="mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Engagements Overview</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Requirement</th>
                  <th className="px-6 py-3 font-medium">Stage</th>
                  <th className="px-6 py-3 font-medium">Days</th>
                  <th className="px-6 py-3 font-medium">Court</th>
                </tr>
              </thead>
              <tbody>
                {state.links.map((link) => (
                    <tr key={link.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-3 font-medium text-slate-900">{link.requirementTitle}</td>
                      <td className="px-6 py-3">
                        <Badge variant="neutral">{getStatusLabel(link.state)}</Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{link.tat.vendorPendingDays + link.tat.buyerPendingDays}d</td>
                      <td className="px-6 py-3">
                        <CourtBadge court={link.court} />
                      </td>
                    </tr>
                ))}
                {state.links.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No engagements yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
