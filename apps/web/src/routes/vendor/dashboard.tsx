import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOnboarding, type VendorOnboarding } from '../../lib/vendor-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { ProgressDot } from '../../components/atoms/ProgressDot.js';
import { Badge } from '../../components/atoms/Badge.js';

const STEPS = ['Registration', 'Identity verified', 'Documents uploaded', 'Under review', 'Contract signing', 'Onboarded'];

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly data: VendorOnboarding };

function currentStepIndex(data: VendorOnboarding): number {
  if (!data.vendor) return 0;
  if (!data.vendor.isVerified) return 1;
  if (data.requests.length === 0) return 1;
  const statuses = data.requests.map((r) => r.status);
  if (statuses.some((s) => s === 'COMPLETED')) return 5;
  if (statuses.some((s) => s === 'CONTRACT_REVIEW' || s === 'ERP_PUSH')) return 4;
  if (statuses.some((s) => s === 'DEEP_VERIFICATION' || s === 'APPROVALS_IN_PROGRESS')) return 3;
  if (statuses.some((s) => s === 'FULL_PACK_SUBMITTED' || s === 'AWARDED')) return 2;
  return 1;
}

export function VendorDashboard(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  function load(): void {
    setState({ kind: 'loading' });
    getOnboarding()
      .then((data) => setState({ kind: 'ready', data }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load your onboarding status.') }));
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
  const stepIndex = currentStepIndex(data);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">My onboarding</h1>
      <p className="mt-1 text-sm text-slate-500">Where you stand across every buyer request you've been invited to.</p>

      {!data.vendor?.isVerified && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Action needed: complete your pre-qualification to move forward.{' '}
          <Link to="/vendor/prequal" className="font-medium underline">Start now</Link>
        </div>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Your progress</h2>
        <div className="mt-4 flex items-start">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <ProgressDot state={i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'} size="md" />
                <p className="mt-2 max-w-[80px] text-center text-xs leading-tight text-slate-500">{label}</p>
              </div>
              {i < STEPS.length - 1 && <div className="mt-3 mx-1 h-0.5 flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Requests you're part of</h2>
        </div>
        {data.requests.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">You haven't been added to any requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-4 py-3"><Badge variant="info">{r.status.replace(/_/g, ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
