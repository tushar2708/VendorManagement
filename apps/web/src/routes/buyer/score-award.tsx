import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getScoring, updateScoring, awardCandidate, type ScoringCandidate, type ScoringCriterion } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Card, Spinner, Button } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { ScoreBar } from '../../components/atoms/ScoreBar.js';
import { CriteriaWeight } from '../../components/molecules/CriteriaWeight.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly criteria: ScoringCriterion[]; readonly candidates: ScoringCandidate[] };

export function ScoreAwardPage(): React.ReactElement {
  const { id = '' } = useParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [awardError, setAwardError] = useState<string | null>(null);

  function load(): void {
    setState({ kind: 'loading' });
    getScoring(id)
      .then(({ criteria, candidates }) => setState({ kind: 'ready', criteria, candidates }))
      .catch((e: unknown) => setState({ kind: 'error', message: errorMessage(e, 'Could not load scoring data.') }));
  }

  useEffect(load, [id]);

  function handleWeightChange(name: string, weight: number): void {
    if (state.kind !== 'ready') return;
    setState({ ...state, criteria: state.criteria.map((c) => (c.name === name ? { ...c, weight } : c)) });
  }

  async function handleSaveWeights(): Promise<void> {
    if (state.kind !== 'ready') return;
    await updateScoring(id, state.criteria.map((c) => ({ name: c.name, weight: c.weight })));
  }

  async function handleAward(candidateId: string): Promise<void> {
    setAwarding(true);
    setAwardError(null);
    try {
      await awardCandidate(id, candidateId);
      load();
    } catch (e: unknown) {
      setAwardError(errorMessage(e, 'Could not award this candidate.'));
    } finally {
      setAwarding(false);
    }
  }

  if (state.kind === 'loading') return <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>;
  if (state.kind === 'error') return (
    <Card className="mt-8 p-8 text-center">
      <p className="text-sm text-rose-600">{state.message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Try again</Button>
    </Card>
  );

  const totalWeight = state.criteria.reduce((sum, c) => sum + c.weight, 0);
  const selected = state.candidates.find((c) => c.id === selectedId) ?? state.candidates[0] ?? null;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Score &amp; award</h1>
      <p className="mt-1 text-sm text-slate-500">Compare cleared candidates against your weighted criteria and confirm an award.</p>

      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Adjust weights on the left to see how the ranking changes. Weights should add up to 100% for a balanced score.
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[250px_1fr_300px]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Internal criteria weights</h2>
          <div className="mt-2 divide-y divide-slate-100">
            {state.criteria.map((c) => (
              <CriteriaWeight key={c.name} name={c.name} weight={c.weight} onChange={(w) => handleWeightChange(c.name, w)} />
            ))}
          </div>
          <p className={`mt-2 text-xs font-medium ${totalWeight === 100 ? 'text-slate-500' : 'text-rose-600'}`}>
            Total: {totalWeight}%
          </p>
          <Button size="sm" className="mt-3 w-full" onClick={handleSaveWeights}>Save weights</Button>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Cleared candidates</h2>
          </div>
          {state.candidates.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No candidates have cleared pre-qualification yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Weighted score</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Lead time</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {state.candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/60 ${selected?.id === c.id ? 'bg-indigo-50/60' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{c.legalName ?? c.contactEmail ?? 'Unnamed vendor'}</td>
                    <td className="px-4 py-3">{c.isAwarded ? <Badge variant="success">Awarded</Badge> : <Badge variant="neutral">Cleared</Badge>}</td>
                    <td className="px-4 py-3">{c.score != null ? `${c.score}%` : '—'}</td>
                    <td className="px-4 py-3">{c.commercials?.basePrice != null ? `₹${c.commercials.basePrice}` : '—'}</td>
                    <td className="px-4 py-3">{c.commercials?.leadTimeDays != null ? `${c.commercials.leadTimeDays}d` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" disabled={c.isAwarded || awarding} onClick={(e) => { e.stopPropagation(); void handleAward(c.id); }}>
                        {c.isAwarded ? 'Awarded' : 'Confirm award'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {awardError && <p className="px-6 py-3 text-sm text-rose-600">{awardError}</p>}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Deep dive</h2>
          {!selected ? (
            <p className="mt-2 text-sm text-slate-400">Select a candidate to see their breakdown.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{selected.legalName ?? selected.contactEmail}</p>
                <p className="text-xs text-slate-500">{selected.city}{selected.city && selected.state ? ', ' : ''}{selected.state}</p>
              </div>
              <div className="space-y-2">
                {selected.scoreBreakdown && Object.entries(selected.scoreBreakdown).map(([name, value]) => (
                  <ScoreBar key={name} value={value} label={name} />
                ))}
              </div>
              {selected.commercials && (
                <div className="space-y-1 text-xs text-slate-600">
                  {selected.commercials.basePrice != null && <p>Base price: ₹{selected.commercials.basePrice}</p>}
                  {selected.commercials.toolingPerUnit != null && <p>Tooling per unit: ₹{selected.commercials.toolingPerUnit}</p>}
                  {selected.commercials.logisticsPerUnit != null && <p>Logistics per unit: ₹{selected.commercials.logisticsPerUnit}</p>}
                  {selected.commercials.capacity != null && <p>Capacity: {selected.commercials.capacity}</p>}
                  {selected.commercials.leadTimeDays != null && <p>Lead time: {selected.commercials.leadTimeDays} days</p>}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm">Keep others warm</Button>
      </div>
    </div>
  );
}
