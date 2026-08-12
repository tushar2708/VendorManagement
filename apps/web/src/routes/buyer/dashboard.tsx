import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RequirementSummary, RequirementStats } from '@vendor-management/shared';
import { getRequirements, getRequirementStats } from '../../lib/requirements-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Button, Card, Spinner } from '../../components/ui.js';
import { Icon } from '../../components/atoms/Icon.js';
import { StatsBar } from '../../components/organisms/StatsBar.js';
import { RequestCard } from '../../components/molecules/RequestCard.js';
import { useGridReveal } from '../../hooks/use-grid-reveal.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly requirements: RequirementSummary[]; readonly stats: RequirementStats };

export function BuyerDashboard(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const listRef = useGridReveal<HTMLDivElement>();
  const headingRef = useTextReveal<HTMLHeadingElement>();

  function load(): void {
    setState({ kind: 'loading' });
    Promise.all([getRequirements(), getRequirementStats()])
      .then(([requirements, stats]) => setState({ kind: 'ready', requirements, stats }))
      .catch((error: unknown) => setState({ kind: 'error', message: errorMessage(error, 'Could not load dashboard.') }));
  }

  useEffect(load, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">My requests</h1>
          <p className="mt-1 text-sm text-slate-500">Where every vendor onboarding stands right now.</p>
        </div>
        <Link to="/requests/new">
          <Button>
            <Icon name="plus-circle" size={16} />
            New request
          </Button>
        </Link>
      </div>

      {state.kind === 'loading' && (
        <div className="mt-16 grid place-items-center text-slate-400">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
            Try again
          </Button>
        </Card>
      )}

      {state.kind === 'ready' && (
        <>
          <div className="mt-6">
            <StatsBar stats={state.stats} />
          </div>
          {state.requirements.length === 0 ? (
            <Card className="mt-8 grid place-items-center gap-3 p-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-500">
                <Icon name="plus-circle" size={24} />
              </div>
              <p className="text-base font-semibold">No requirements yet</p>
              <p className="max-w-sm text-sm text-slate-500">Create your first requirement to start shortlisting and inviting vendors.</p>
              <Link to="/requests/new" className="mt-1">
                <Button>New requirement</Button>
              </Link>
            </Card>
          ) : (
            <div ref={listRef} className="mt-6 space-y-4">
              {state.requirements.map((r, i) => (
                <RequestCard key={r.id} requirement={r} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
