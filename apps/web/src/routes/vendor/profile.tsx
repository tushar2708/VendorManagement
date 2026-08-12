import { useEffect, useState } from 'react';
import { getVendorProfile, type VendorProfile, type VendorProfileCheck } from '../../lib/vendor-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button, Chip } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { VerificationRow } from '../../components/molecules/VerificationRow.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly vendor: VendorProfile; readonly checks: VendorProfileCheck[] };

export function VendorProfilePage(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  function load(): void {
    setState({ kind: 'loading' });
    getVendorProfile()
      .then(({ vendor, checks }) => setState({ kind: 'ready', vendor, checks }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load your profile.') }));
  }

  useEffect(() => {
    load();
  }, []);

  if (state.kind === 'loading') return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (state.kind === 'error') return (
    <Card className="mt-8 p-8 text-center">
      <p className="text-sm text-rose-600">{state.message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
    </Card>
  );

  const { vendor, checks } = state;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{vendor.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{vendor.contactEmail}</p>
        </div>
        <Badge variant={vendor.isVerified ? 'success' : 'neutral'}>{vendor.isVerified ? '✓ Verified' : 'Not verified'}</Badge>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold">Identity and tax</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            ['PAN', vendor.panNumber],
            ['GSTIN', vendor.gstin],
            ['UDYAM', vendor.udyamNumber],
            ['VENDOR CODE', vendor.vendorCode],
            ['CATEGORY', vendor.category],
            ['TYPE', vendor.vendorType],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{value || '—'}</p>
            </div>
          ))}
        </div>
      </Card>

      {vendor.certifications.length > 0 && (
        <Card className="mt-4 p-6">
          <h2 className="text-lg font-semibold">Certifications</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {vendor.certifications.map((cert: string) => <Chip key={cert}>{cert}</Chip>)}
          </div>
        </Card>
      )}

      {checks.length > 0 && (
        <Card className="mt-4 p-6">
          <h2 className="text-lg font-semibold">Verification checks</h2>
          <div className="mt-4 space-y-3">
            {checks.map((c) => (
              <VerificationRow key={c.id} type={c.type} description={c.notes || `Auto-verified via ${c.type} API`} status={c.status as 'PASS' | 'PARTIAL_MATCH' | 'FAIL' | 'PENDING' | 'IN_PROGRESS'} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
