import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth.js';
import {
  getRequirementAnalytics,
  getApprovalAnalytics,
  type RequirementAnalytics,
  type ApprovalAnalytics,
} from '../../lib/requirements-api.js';
import { canSwitchView } from '../../lib/permissions.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { StatCard } from '../../components/molecules/StatCard.js';
import { FunnelChart } from '../../components/atoms/FunnelChart.js';
import { DonutChart } from '../../components/atoms/DonutChart.js';
import { HBarChart } from '../../components/atoms/HBarChart.js';
import { formatDate } from '../../lib/format.js';
import { BuyerExecutiveDashboard } from './dashboard.js';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; req: RequirementAnalytics; appr: ApprovalAnalytics };

interface LeadershipDashboardProps {
  onSwitchToExecutive?: () => void;
}

export function BuyerLeadershipDashboard({ onSwitchToExecutive }: LeadershipDashboardProps = {}): React.ReactElement {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [showExecutive, setShowExecutive] = useState(false);

  function load() {
    setState({ kind: 'loading' });
    Promise.all([getRequirementAnalytics(), getApprovalAnalytics()])
      .then(([req, appr]) => setState({ kind: 'ready', req, appr }))
      .catch((e: unknown) =>
        setState({
          kind: 'error',
          message: errorMessage(e, 'Could not load analytics.'),
        })
      );
  }

  useEffect(load, []);

  if (showExecutive) return <BuyerExecutiveDashboard onSwitchToLeadership={() => setShowExecutive(false)} />;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Leadership Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            High-level overview of vendor onboarding across all requests.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (onSwitchToExecutive) onSwitchToExecutive();
            else setShowExecutive(true);
          }}
        >
          Go to Drill-Down View
        </Button>
      </div>

      {state.kind === 'loading' && (
        <div className="mt-16 grid place-items-center">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
            Try again
          </Button>
        </Card>
      )}

      {state.kind === 'ready' && (
        <>
          {/* KPI Tiles */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total requests" value={state.req.totalRequests} />
            <StatCard
              label="Avg days to onboard"
              value={
                state.req.avgDaysToOnboard > 0
                  ? `${state.req.avgDaysToOnboard}d`
                  : '—'
              }
            />
            <StatCard label="Pass rate" value={`${state.req.passRate ?? 0}%`} />
            <StatCard
              label="SLA compliance"
              value={`${state.appr.slaComplianceRate}%`}
            />
            <StatCard label="Vendors in directory" value={state.req.directoryCount ?? 0} />
          </div>

          {/* Charts row 1 */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Pipeline Funnel</h2>
              <p className="mt-1 text-sm text-slate-500">
                Requests by onboarding stage
              </p>
              <FunnelChart
                className="mt-4"
                steps={[
                  {
                    name: 'Intake & invite',
                    value: state.req.funnel?.['Intake & invite'] ?? 0,
                    color: '#6366f1',
                  },
                  {
                    name: 'In progress',
                    value: state.req.funnel?.['In progress'] ?? 0,
                    color: '#f59e0b',
                  },
                  {
                    name: 'Closed',
                    value: state.req.funnel?.['Closed'] ?? 0,
                    color: '#059669',
                  },
                ]}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">SLA Risk Distribution</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pending approvals by risk level
              </p>
              <DonutChart
                className="mt-4"
                data={[
                  {
                    name: 'On track',
                    value: state.appr.distribution.ON_TRACK ?? 0,
                    color: '#10b981',
                  },
                  {
                    name: 'At risk',
                    value: state.appr.distribution.AT_RISK ?? 0,
                    color: '#f59e0b',
                  },
                  {
                    name: 'Overdue',
                    value: state.appr.distribution.OVERDUE ?? 0,
                    color: '#ef4444',
                  },
                ]}
              />
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Vendor Categories</h2>
              <p className="mt-1 text-sm text-slate-500">
                Requests by vendor type
              </p>
              <HBarChart
                className="mt-4"
                data={[
                  {
                    name: 'Production part',
                    value: state.req.vendorTypes?.PRODUCTION_PART ?? 0,
                  },
                  {
                    name: 'Indirect / services',
                    value: state.req.vendorTypes?.INDIRECT_SERVICES ?? 0,
                  },
                ]}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">Recent Completions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Last 5 completed onboardings
              </p>
              {(state.req.recentCompletions ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  No completions yet.
                </p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-slate-500">
                      <th className="pb-2 font-medium">Vendor</th>
                      <th className="pb-2 font-medium">Request</th>
                      <th className="pb-2 font-medium">Days</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.req.recentCompletions ?? []).map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 font-medium text-slate-800">
                          {c.vendorName}
                        </td>
                        <td className="py-2 text-slate-600">{c.title}</td>
                        <td className="py-2 text-slate-600">{c.days}d</td>
                        <td className="py-2 text-slate-400">
                          {formatDate(c.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
