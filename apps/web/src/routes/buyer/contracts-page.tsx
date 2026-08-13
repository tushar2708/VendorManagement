import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BuyerLinkDetail } from '@vendor-management/shared';
import { getBuyerLink, erpPackUrl } from '../../lib/buyer-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Button, Card, Spinner, cn } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { ContractSetView } from '../../components/organisms/ContractSetView.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/atoms/Dialog.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly link: BuyerLinkDetail };

interface HandoffSummaryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly vendorCode: string;
  readonly vendorName: string;
  readonly linkId: string;
  readonly allContractsExecuted: boolean;
}

function HandoffSummaryDialog({
  open,
  onOpenChange,
  vendorCode,
  vendorName,
  linkId,
  allContractsExecuted,
}: HandoffSummaryDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Handoff to ERP complete</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vendor Code Display */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vendor code
            </label>
            <div className="rounded-lg bg-slate-50 p-4">
              <code className="font-mono text-lg font-bold text-slate-900">{vendorCode}</code>
            </div>
          </div>

          {/* Vendor Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vendor name
            </label>
            <p className="text-sm font-medium text-slate-900">{vendorName}</p>
          </div>

          {/* Contract Status Badge */}
          {allContractsExecuted && (
            <div className="rounded-lg bg-emerald-50 p-4">
              <Badge variant="success" className="w-full text-center">
                All contracts: Executed
              </Badge>
            </div>
          )}

          {/* Download Pack Button */}
          <div>
            <a href={erpPackUrl(linkId)} download className="block">
              <Button className="w-full">
                ↓ Download contract pack
              </Button>
            </a>
          </div>

          {/* Close Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BuyerContractsPage(): React.ReactElement {
  const { id: linkId = '', vendorId = '' } = useParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);

  const headingRef = useTextReveal<HTMLHeadingElement>();

  useEffect(() => {
    setState({ kind: 'loading' });
    getBuyerLink(linkId)
      .then((link) => {
        setState({ kind: 'ready', link });
        // Show handoff dialog if ERP syncing or onboarded
        if (link.state === 'ERP_SYNCING' || link.state === 'ONBOARDED') {
          setShowHandoffDialog(true);
        }
      })
      .catch((error: unknown) =>
        setState({ kind: 'error', message: errorMessage(error, 'Could not load contracts.') })
      );
  }, [linkId]);

  async function handleRefresh(): Promise<void> {
    try {
      const link = await getBuyerLink(linkId);
      setState({ kind: 'ready', link });
    } catch (error: unknown) {
      console.error('Failed to refresh:', error);
    }
  }

  function reload(): void {
    setState({ kind: 'loading' });
    getBuyerLink(linkId)
      .then((link) => setState({ kind: 'ready', link }))
      .catch((error: unknown) =>
        setState({ kind: 'error', message: errorMessage(error, 'Could not load contracts.') })
      );
  }

  if (state.kind === 'loading') {
    return (
      <div className="mt-16 grid place-items-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Card className="mt-8 p-8 text-center">
        <p className="text-sm text-rose-600">{state.message}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={reload}>
          Try again
        </Button>
      </Card>
    );
  }

  const { link } = state;
  const allContractsExecuted = link.contracts.length > 0 && link.contracts.every((c) => c.state === 'EXECUTED');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">
            Contracts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, sign, and manage vendor contracts.
          </p>
        </div>
        <Link to={`/requests/${linkId}`}>
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      {/* Status Info Card */}
      <Card className={cn(
        'mt-6 p-4 border-l-4',
        link.state === 'ONBOARDED' && 'bg-emerald-50/40 border-l-emerald-500',
        link.state === 'ERP_SYNCING' && 'bg-blue-50/40 border-l-blue-500',
        !['ONBOARDED', 'ERP_SYNCING'].includes(link.state) && 'bg-amber-50/40 border-l-amber-500'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {link.candidate.legalName || 'Vendor'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {link.contracts.length} contracts
              {allContractsExecuted ? ' • All executed' : null}
            </p>
          </div>
          <Badge variant={allContractsExecuted ? 'success' : 'neutral'}>
            {link.state === 'ONBOARDED' ? '✓ Onboarded' : link.state === 'ERP_SYNCING' ? 'Syncing...' : link.state}
          </Badge>
        </div>
      </Card>

      {/* Contracts Panel */}
      <div className="mt-6">
        <ContractSetView vendorId={vendorId} side="BUYER" onRefresh={handleRefresh} />
      </div>

      {/* Handoff Summary Dialog */}
      <HandoffSummaryDialog
        open={showHandoffDialog}
        onOpenChange={setShowHandoffDialog}
        vendorCode={link.erpVendorCode || 'N/A'}
        vendorName={link.candidate.legalName || 'Vendor'}
        linkId={linkId}
        allContractsExecuted={allContractsExecuted}
      />
    </div>
  );
}
