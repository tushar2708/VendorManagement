import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getScoring, upsertQuotation } from '../../lib/quotation-api.js';
import { awardCandidate } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { AwardThreePane } from '../../components/organisms/AwardThreePane.js';
import { QuoteDialog } from '../../components/molecules/QuoteDialog.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly data: Awaited<ReturnType<typeof getScoring>> };

type DialogState =
  | { readonly kind: 'closed' }
  | { readonly kind: 'quote'; readonly vendorId: string; readonly candidateName: string };

type ConfirmState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'confirming'; readonly vendorId: string };

export function ScoreAwardPage(): React.ReactElement {
  const { id = '' } = useParams();
  const headingRef = useTextReveal<HTMLHeadingElement>();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [dialogState, setDialogState] = useState<DialogState>({ kind: 'closed' });
  const [confirmState, setConfirmState] = useState<ConfirmState>({ kind: 'idle' });
  const [keepOthersWarm, setKeepOthersWarm] = useState(false);

  function load(): void {
    setState({ kind: 'loading' });
    getScoring(id)
      .then((data) => setState({ kind: 'ready', data }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load scoring data.') }));
  }

  useEffect(load, [id]);

  async function handleQuoteEdit(vendorId: string): Promise<void> {
    setDialogState({ kind: 'quote', vendorId, candidateName: vendorId });
  }

  async function handleQuoteSave(vendorId: string, data: unknown): Promise<void> {
    try {
      await upsertQuotation(id!, vendorId, data as Record<string, unknown>);
      setDialogState({ kind: 'closed' });
      load();
    } catch (e: unknown) {
      throw new Error(errorMessage(e, 'Could not save quotation.'));
    }
  }

  function handleAward(vendorId: string, keepOthersWarm: boolean): void {
    setKeepOthersWarm(keepOthersWarm);
    setConfirmState({ kind: 'confirming', vendorId });
  }

  async function handleAwardSubmit(): Promise<void> {
    if (confirmState.kind !== 'confirming') return;
    try {
      await awardCandidate(id, confirmState.vendorId);
      setConfirmState({ kind: 'idle' });
      setKeepOthersWarm(false);
      load();
    } catch (e: unknown) {
      throw new Error(errorMessage(e, 'Could not award this candidate.'));
    }
  }

  function handleAwardCancel(): void {
    setConfirmState({ kind: 'idle' });
    setKeepOthersWarm(false);
  }

  if (state.kind === 'loading') return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (state.kind === 'error') return (
    <Card className="mt-8 p-8 text-center">
      <p className="text-sm text-rose-600">{state.message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
    </Card>
  );

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Score &amp; award</h1>
      <p className="mt-1 text-sm text-slate-500">Compare cleared candidates against your weighted criteria and confirm an award.</p>

      <AwardThreePane
        requestId={id}
        candidates={state.data.candidates || []}
        criteria={state.data.criteria || []}
        onQuoteEdit={handleQuoteEdit}
        onAward={handleAward}
      />

      {confirmState.kind === 'confirming' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <Card className="w-96 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Confirm award</h2>
            <p className="mt-2 text-sm text-slate-600">Confirm this vendor as the award winner.</p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="warm-checkbox"
                checked={keepOthersWarm}
                onChange={(e) => setKeepOthersWarm(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="warm-checkbox" className="text-sm text-slate-700">Keep others warm</label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={handleAwardCancel}>Cancel</Button>
              <Button size="sm" onClick={() => void handleAwardSubmit()}>Confirm award</Button>
            </div>
          </Card>
        </div>
      )}

      {dialogState.kind === 'quote' && (
        <QuoteDialog
          open={true}
          vendorName={dialogState.candidateName}
          onClose={() => setDialogState({ kind: 'closed' })}
          onSave={(data) => void handleQuoteSave(dialogState.vendorId, data)}
        />
      )}
    </div>
  );
}
