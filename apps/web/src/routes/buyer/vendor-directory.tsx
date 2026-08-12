import { useEffect, useState } from 'react';
import type { DirectoryVendor } from '@vendor-management/shared';
import { getDirectory } from '../../lib/candidates-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { SearchBar } from '../../components/molecules/SearchBar.js';
import { VendorRow } from '../../components/molecules/VendorRow.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { Icon } from '../../components/atoms/Icon.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly vendors: DirectoryVendor[] };

export function VendorDirectoryPage(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [search, setSearch] = useState('');
  const headingRef = useTextReveal<HTMLHeadingElement>();

  function load(searchTerm?: string): void {
    setState({ kind: 'loading' });
    getDirectory({ search: searchTerm || undefined })
      .then((vendors) => setState({ kind: 'ready', vendors }))
      .catch((error: unknown) => setState({ kind: 'error', message: errorMessage(error, 'Could not load directory.') }));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Vendor Directory</h1>
      <p className="mt-1 text-sm text-slate-500">Every supplier shortlisted so far, across all requests.</p>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email or category" className="mt-6 max-w-lg" />

      {state.kind === 'loading' && (
        <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>
      )}

      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => load()}>Try again</Button>
        </Card>
      )}

      {state.kind === 'ready' && (
        state.vendors.length === 0 ? (
          <Card className="mt-8 grid place-items-center gap-3 p-14 text-center">
            <Icon name="building" size={32} className="text-slate-300" />
            <p className="text-base font-semibold">No vendors found</p>
            <p className="text-sm text-slate-500">Vendors appear here after being shortlisted for a requirement.</p>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {state.vendors.map((v) => (
              <VendorRow
                key={v.id}
                id={v.id}
                name={v.legalName}
                subtitle={[v.processTags.join(' · '), v.contactEmail].filter(Boolean).join(' · ')}
                vendorCode={null}
                isVerified={v.badgeState === 'VERIFIED'}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
