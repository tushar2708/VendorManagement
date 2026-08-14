import { useEffect, useState } from 'react';
import { getApprovals, decideApproval, type ApprovalItem } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { EmptyState } from '../../components/molecules/EmptyState.js';
import { VendorDrawer } from '../../components/organisms/VendorDrawer.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';
import { useToast } from '../../components/atoms/Toast.js';
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

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  APPROVED: 'success', EDD_COMPLETE: 'success', IN_PROGRESS: 'info',
  INFORMATION_REQUIRED: 'warning', CHANGES_REQUESTED: 'danger', PENDING: 'neutral',
};

interface VendorGroup {
  vendorName: string;
  linkId: string;
  stages: ApprovalItem[];
}

function groupByVendor(approvals: ApprovalItem[]): VendorGroup[] {
  const map = new Map<string, VendorGroup>();
  for (const a of approvals) {
    const key = a.linkId;
    if (!map.has(key)) {
      map.set(key, { vendorName: a.vendorName ?? 'Unknown', linkId: a.linkId, stages: [] });
    }
    map.get(key)!.stages.push(a);
  }
  return Array.from(map.values());
}

export function ApproverQueuePage(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [drawerLinkId, setDrawerLinkId] = useState<string | null>(null);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const headingRef = useTextReveal<HTMLHeadingElement>();
  const toast = useToast();
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
    try {
      await decideApproval(id, { status: decision });
      load();
      toast.success('Decision recorded');
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'Failed to record decision'));
    }
  }

  const groups = state.kind === 'ready' ? groupByVendor(state.approvals) : [];

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Approvals</h1>
      <p className="mt-1 text-sm text-slate-500">Pending governance decisions, grouped by vendor.</p>

      {state.kind === 'loading' && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}
      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
        </Card>
      )}
      {state.kind === 'ready' && groups.length === 0 && (
        <div className="mt-8">
          <EmptyState icon="check-circle" title="Nothing waiting on you" description="Every control function on every active vendor has cleared." />
        </div>
      )}
      {state.kind === 'ready' && groups.length > 0 && (
        <div className="mt-6 space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedVendor === group.linkId;
            const pendingCount = group.stages.length;
            const worstRisk = group.stages.some(s => s.slaRisk === 'OVERDUE') ? 'OVERDUE'
              : group.stages.some(s => s.slaRisk === 'AT_RISK') ? 'AT_RISK' : 'ON_TRACK';

            return (
              <Card key={group.linkId} className="overflow-hidden">
                {/* Vendor header row — click to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedVendor(isExpanded ? null : group.linkId)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold text-slate-900">{group.vendorName}</span>
                    <Badge variant="neutral">{pendingCount} pending</Badge>
                    <Badge variant={RISK_VARIANT[worstRisk] ?? 'neutral'}>{worstRisk.replace('_', ' ')}</Badge>
                  </div>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setDrawerLinkId(group.linkId); }}>
                    View details
                  </Button>
                </button>

                {/* Expanded: individual stages */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-2.5 font-medium">Control function</th>
                          <th className="px-5 py-2.5 font-medium">Status</th>
                          <th className="px-5 py-2.5 font-medium">Age</th>
                          <th className="px-5 py-2.5 font-medium">SLA target</th>
                          <th className="px-5 py-2.5 font-medium">Risk</th>
                          <th className="px-5 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.stages.map((a) => (
                          <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                            <td className="px-5 py-3 font-medium text-slate-800">{STAGE_LABELS[a.stage] ?? a.stage}</td>
                            <td className="px-5 py-3">
                              <Badge variant={STATUS_VARIANT[a.status] ?? 'neutral'}>{a.status.replace('_', ' ')}</Badge>
                            </td>
                            <td className="px-5 py-3 text-slate-600">{a.ageDays}d</td>
                            <td className="px-5 py-3 text-slate-600">{a.slaDays}d</td>
                            <td className="px-5 py-3">
                              <Badge variant={RISK_VARIANT[a.slaRisk] ?? 'neutral'}>{a.slaRisk.replace('_', ' ')}</Badge>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {canMakeDecisions && (
                                <div className="flex items-center gap-2 justify-end">
                                  <Button size="sm" variant="secondary" onClick={() => handleDecide(a.id, 'CHANGES_REQUESTED')}>
                                    Request Changes
                                  </Button>
                                  <Button size="sm" onClick={() => handleDecide(a.id, 'APPROVED')}>
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {drawerLinkId && <VendorDrawer linkId={drawerLinkId} onClose={() => { setDrawerLinkId(null); load(); }} />}
    </div>
  );
}
