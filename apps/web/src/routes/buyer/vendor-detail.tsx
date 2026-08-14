import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVendorDetail, type VendorDetailResponse } from '../../lib/candidates-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button, Chip } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { VerificationRow } from '../../components/molecules/VerificationRow.js';
import { formatDate } from '../../lib/format.js';
import { track } from '../../lib/analytics.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly data: VendorDetailResponse };

type TabType = 'Overview' | 'Documents' | 'Contracts' | 'Activity';

export function VendorDetailPage(): React.ReactElement {
  const { id = '' } = useParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  useEffect(() => {
    setState({ kind: 'loading' });
    getVendorDetail(id)
      .then((data) => setState({ kind: 'ready', data }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Vendor not found.') }));
  }, [id]);

  if (state.kind === 'loading') return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (state.kind === 'error') return (
    <Card className="mt-8 p-8 text-center">
      <p className="text-sm text-rose-600">{state.message}</p>
      <Link to="/directory"><Button variant="secondary" size="sm" className="mt-4">Back to directory</Button></Link>
    </Card>
  );

  const { vendor: v, verificationChecks } = state.data;

  return (
    <div>
      <Link to="/directory" className="text-sm text-slate-500 hover:text-slate-700">← Vendor Directory</Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{v.legalName}</h1>
          <p className="mt-1 text-sm text-slate-500">{v.contactEmail}</p>
        </div>
        <Badge variant={v.badgeState === 'VERIFIED' ? 'success' : v.badgeState === 'STALE' ? 'warning' : 'neutral'}>
          {v.badgeState === 'VERIFIED' ? '✓ Verified' : v.badgeState === 'STALE' ? 'Stale' : 'Not verified'}
        </Badge>
      </div>

      <div className="mt-6 border-b border-slate-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {(['Overview', 'Documents', 'Contracts', 'Activity'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab !== activeTab) {
                  track('vendor_detail_tab_switched', { tab, vendor_id: id });
                }
                setActiveTab(tab);
              }}
              className={`border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview' && (
        <>
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold">Identity and tax</h2>
            <p className="mt-1 text-sm text-slate-500">What the buyer needs to raise a purchase order.</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ['PAN', v.pan],
                ['GSTIN', v.primaryGstin],
                ['CONTACT', v.contactEmail],
                ['CITY', v.city],
                ['STATE', v.state],
                ['ADDED', formatDate(v.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{value || '—'}</p>
                </div>
              ))}
            </div>
          </Card>

          {v.certificationTags.length > 0 && (
            <Card className="mt-4 p-6">
              <h2 className="text-lg font-semibold">Certifications</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {v.certificationTags.map((cert: string) => <Chip key={cert}>{cert}</Chip>)}
              </div>
            </Card>
          )}

          {verificationChecks.length > 0 && (
            <Card className="mt-4 p-6">
              <h2 className="text-lg font-semibold">Verification checks</h2>
              <p className="mt-1 text-sm text-slate-500">Run against the PAN, GST and Udyam records.</p>
              <div className="mt-4 space-y-3">
                {verificationChecks.map((vc) => (
                  <VerificationRow key={vc.id} type={vc.checkType} description={vc.detail ? String(vc.detail) : `Auto-verified via ${vc.checkType} API`} status={vc.status} />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'Documents' && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="mt-2 text-sm text-slate-500">Document listing will appear here once the vendor submits documents.</p>
        </Card>
      )}

      {activeTab === 'Contracts' && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Contracts</h2>
          <p className="mt-2 text-sm text-slate-500">Contract status will appear here after the vendor is awarded.</p>
        </Card>
      )}

      {activeTab === 'Activity' && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Activity</h2>
          <p className="mt-2 text-sm text-slate-500">Activity timeline will appear here as events occur.</p>
        </Card>
      )}
    </div>
  );
}
