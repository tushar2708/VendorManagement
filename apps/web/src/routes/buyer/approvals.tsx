import { useEffect, useState } from 'react';
import { getApprovals, decideApproval, type ApprovalItem } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { Toast } from '../../components/atoms/Toast.js';
import { EmptyState } from '../../components/molecules/EmptyState.js';
import { VendorDrawer } from '../../components/organisms/VendorDrawer.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';
import { useToast } from '../../hooks/use-toast.js';
import { useAuth } from '../../hooks/use-auth.js';
import { canDecide } from '../../lib/permissions.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly approvals: ApprovalItem[] };

const STAGE_LABELS: Record<string, string> = {
  FINANCIAL_CRIME: 'Financial Crime', COMPLIANCE: 'Compliance', LEGAL: 'Legal',
  IT_INFOSEC: 'IT / InfoSec', TAX: 'Tax', PROCUREMENT: 'Procurement',
  DATA_PRIVACY: 'Data Privacy', BUSINESS_OWNER: 'Business Owner',
};

const RISK_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  ON_TRACK: 'success', AT_RISK: 'warning', OVERDUE: 'danger',
};

export function ApproverQueuePage(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [drawerLinkId, setDrawerLinkId] = useState<string | null>(null);
  const headingRef = useTextReveal<HTMLHeadingElement>();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const canMakeDecisions = canDecide(user?.role ?? 'BUYER', user?.tier ?? 'EXECUTIVE');

  function load(): void {
    setState({ kind: 'loading' });
    getApprovals('PENDING')
      .then((approvals) => setState({ kind: 'ready', approvals }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load approvals.') }));
  }

  useEffect(load, []);

  async function handleDecide(id: string, decision: string): Promise<void> {
    await decideApproval(id, { status: decision });
    load();
    showToast('Decision recorded', 'success');
  }

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Approvals</h1>
      <p className="mt-1 text-sm text-slate-500">Every control function still waiting on a decision, across all active vendors.</p>

      {state.kind === 'loading' && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}
      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
        </Card>
      )}
      {state.kind === 'ready' && state.approvals.length === 0 && (
        <div className="mt-8">
          <EmptyState icon="check-circle" title="Nothing waiting on you" description="Every control function on every active vendor has cleared." />
        </div>
      )}
      {state.kind === 'ready' && state.approvals.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Control function</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">SLA target</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Engagement</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {state.approvals.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.vendorName}</td>
                  <td className="px-4 py-3">{STAGE_LABELS[a.stage] ?? a.stage}</td>
                  <td className="px-4 py-3">{a.ageDays}d</td>
                  <td className="px-4 py-3">{a.slaDays}d</td>
                  <td className="px-4 py-3">
                    <Badge variant={RISK_VARIANT[a.slaRisk] ?? 'neutral'}>{a.slaRisk.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="secondary" onClick={() => setDrawerLinkId(a.linkId)}>View</Button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="secondary" onClick={() => handleDecide(a.id, 'REJECTED')}>Reject</Button>
                      <Button size="sm" onClick={() => handleDecide(a.id, 'APPROVED')}>Approve</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {drawerLinkId && <VendorDrawer linkId={drawerLinkId} onClose={() => setDrawerLinkId(null)} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={hideToast} />}
    </div>
  );
}
