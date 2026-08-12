import { useEffect, useState } from 'react';
import { getOnboarding, type VendorOnboarding } from '../../lib/vendor-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { StatCard } from '../../components/molecules/StatCard.js';
import { Badge } from '../../components/atoms/Badge.js';
import { DonutChart } from '../../components/atoms/DonutChart.js';
import VendorExecutiveDashboard from './dashboard.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly data: VendorOnboarding };

function calculateDaysInStage(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'CONTRACT_REVIEW' || status === 'ERP_PUSH') return 'warning';
  return 'info';
}

function hasDocumentsUploaded(status: string): boolean {
  return [
    'FULL_PACK_SUBMITTED',
    'AWARDED',
    'DEEP_VERIFICATION',
    'APPROVALS_IN_PROGRESS',
    'CONTRACT_REVIEW',
    'ERP_PUSH',
    'COMPLETED',
  ].includes(status);
}

export function VendorLeadershipDashboard(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [showExecutive, setShowExecutive] = useState(false);

  function load(): void {
    setState({ kind: 'loading' });
    getOnboarding()
      .then((data) => setState({ kind: 'ready', data }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load your onboarding data.') }));
  }

  useEffect(load, []);

  if (state.kind === 'loading') return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (state.kind === 'error') return (
    <Card className="mt-8 p-8 text-center">
      <p className="text-sm text-rose-600">{state.message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
    </Card>
  );

  const { data } = state;

  if (showExecutive) return <VendorExecutiveDashboard />;

  // Compute KPIs
  const activeOnboardings = data.requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
  const completed = data.requests.filter(r => r.status === 'COMPLETED').length;

  const totalDays = data.requests.reduce((sum, r) => sum + calculateDaysInStage(r.createdAt), 0);
  const avgDaysInStage = data.requests.length > 0 ? Math.round(totalDays / data.requests.length) : 0;

  const docsUploaded = data.requests.filter(r => hasDocumentsUploaded(r.status)).length;
  const docsPending = data.requests.length - docsUploaded;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leadership Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">High-level overview of your onboarding progress across all requests.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowExecutive(true)}>
          View Executive Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active onboardings" value={activeOnboardings} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Avg days in stage" value={avgDaysInStage} />
        <StatCard label="Documents pending" value={docsPending} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Onboarding Status Summary</h2>
          {data.requests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No onboarding requests yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{calculateDaysInStage(r.createdAt)} days open</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(r.status)}>
                    {r.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Document Compliance</h2>
          {data.requests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No requests to show documents for.</p>
          ) : (
            <>
              <DonutChart
                data={[
                  { name: 'Uploaded', value: docsUploaded, color: '#10b981' },
                  { name: 'Pending', value: docsPending > 0 ? docsPending : 1, color: '#e5e7eb' },
                ]}
              />
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {data.requests.length > 0 ? Math.round((docsUploaded / data.requests.length) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-500">Requests with documents uploaded</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
