import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Candidate, InviteStatus, RequirementDetail } from '@vendor-management/shared';
import { getRequirement, removeCandidate } from '../../lib/candidates-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { formatDate } from '../../lib/format.js';
import { AppShell } from '../../components/AppShell.js';
import { AddCandidateModal } from '../../components/AddCandidateModal.js';
import { EditCandidateModal } from '../../components/EditCandidateModal.js';
import { SendInvitesModal } from '../../components/SendInvitesModal.js';
import { Button, Card, Spinner, StageBadge, cn } from '../../components/ui.js';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly detail: RequirementDetail };

const INVITE_STATUS: Record<InviteStatus, { readonly label: string; readonly className: string }> = {
  PENDING: { label: 'Not invited', className: 'bg-slate-100 text-slate-600' },
  INVITED: { label: 'Invited', className: 'bg-violet-50 text-violet-700' },
  OPENED: { label: 'Opened', className: 'bg-sky-50 text-sky-700' },
  REGISTERED: { label: 'Registered', className: 'bg-emerald-50 text-emerald-700' },
  EXPIRED: { label: 'Expired', className: 'bg-rose-50 text-rose-700' },
};

function HeaderCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly onChange: () => void;
  readonly disabled: boolean;
}): React.ReactElement {
  return (
    <input
      ref={(el) => {
        if (el) {
          el.indeterminate = indeterminate;
        }
      }}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rounded border border-slate-300"
      disabled={disabled}
    />
  );
}

export function RequirementDetailPage(): React.ReactElement {
  const { id = '' } = useParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowError, setRowError] = useState<string | null>(null);

  function load(): void {
    setState({ kind: 'loading' });
    void getRequirement(id)
      .then((detail) => setState({ kind: 'ready', detail }))
      .catch((error: unknown) => setState({ kind: 'error', message: errorMessage(error, 'Requirement not found.') }));
  }

  useEffect(load, [id]);

  async function onRemove(candidate: Candidate): Promise<void> {
    setRowError(null);
    try {
      await removeCandidate(id, candidate.id);
      const detail = await getRequirement(id);
      setState({ kind: 'ready', detail });
    } catch (error: unknown) {
      setRowError(errorMessage(error, 'Could not remove the candidate.'));
    }
  }

  return (
    <AppShell>
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to requirements
      </Link>

      {state.kind === 'loading' && (
        <div className="mt-16 grid place-items-center">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {state.kind === 'error' && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-rose-600">{state.message}</p>
          <Link to="/dashboard" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              Back to requirements
            </Button>
          </Link>
        </Card>
      )}

      {state.kind === 'ready' && (
        <Ready
          detail={state.detail}
          onAdd={() => setModalOpen(true)}
          onSend={() => setSendOpen(true)}
          onRemove={onRemove}
          onEdit={(candidate) => setEditCandidate(candidate)}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          rowError={rowError}
        />
      )}

      {state.kind === 'ready' && (
        <>
          <AddCandidateModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            requirementId={id}
            onUpdated={(detail) => setState({ kind: 'ready', detail })}
          />
          <EditCandidateModal
            open={editCandidate !== null}
            onClose={() => setEditCandidate(null)}
            requirementId={id}
            candidate={editCandidate}
            onUpdated={(detail) => {
              setState({ kind: 'ready', detail });
              setEditCandidate(null);
            }}
          />
          <SendInvitesModal
            open={sendOpen}
            onClose={() => setSendOpen(false)}
            requirementId={id}
            pending={state.detail.candidates.filter((c) => c.inviteStatus === 'PENDING')}
            selectedIds={selectedIds}
            onDispatched={(detail) => {
              setState({ kind: 'ready', detail });
              setSelectedIds(new Set());
            }}
          />
        </>
      )}
    </AppShell>
  );
}

function Ready({
  detail,
  onAdd,
  onSend,
  onRemove,
  onEdit,
  selectedIds,
  onSelectChange,
  rowError,
}: {
  readonly detail: RequirementDetail;
  readonly onAdd: () => void;
  readonly onSend: () => void;
  readonly onRemove: (c: Candidate) => void;
  readonly onEdit: (c: Candidate) => void;
  readonly selectedIds: Set<string>;
  readonly onSelectChange: (ids: Set<string>) => void;
  readonly rowError: string | null;
}): React.ReactElement {
  const { title, stage, partCategory, plantLocation, targetAwardDate, processCategories, candidates } = detail;
  const pendingCount = candidates.filter((c) => c.inviteStatus === 'PENDING').length;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <StageBadge stage={stage} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            {partCategory && <span>{partCategory}</span>}
            {plantLocation && <span>{plantLocation}</span>}
            {targetAwardDate && <span>Award by {formatDate(targetAwardDate)}</span>}
            {processCategories.length > 0 && <span>{processCategories.join(', ')}</span>}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Candidates <span className="text-slate-400">({candidates.length})</span>
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onAdd}>
            Add candidate
          </Button>
          <Button
            onClick={onSend}
            disabled={pendingCount === 0}
            title={pendingCount === 0 ? 'No candidates left to invite' : undefined}
          >
            Send invites{selectedIds.size > 0 ? ` (${selectedIds.size})` : pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
        </div>
      </div>

      {rowError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{rowError}</p>}

      {candidates.length === 0 ? (
        <Card className="mt-4 grid place-items-center gap-2 p-12 text-center">
          <p className="text-base font-semibold">No candidates yet</p>
          <p className="max-w-sm text-sm text-slate-500">Add vendors from the verified directory or enter one manually to start.</p>
          <Button className="mt-2" onClick={onAdd}>
            Add candidate
          </Button>
        </Card>
      ) : (
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-4 py-3 font-medium">
                    <HeaderCheckbox
                      checked={selectedIds.size > 0 && selectedIds.size === pendingCount}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < pendingCount}
                      onChange={() => {
                        if (selectedIds.size === 0) {
                          const pendingIds = new Set(candidates.filter((c) => c.inviteStatus === 'PENDING').map((c) => c.id));
                          onSelectChange(pendingIds);
                        } else {
                          onSelectChange(new Set());
                        }
                      }}
                      disabled={pendingCount === 0}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const status = INVITE_STATUS[c.inviteStatus];
                  const canEdit = c.inviteStatus === 'PENDING';
                  const canRemove = c.inviteStatus === 'PENDING';
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="w-12 px-4 py-3">
                        {canEdit && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) {
                                next.add(c.id);
                              } else {
                                next.delete(c.id);
                              }
                              onSelectChange(next);
                            }}
                            className="rounded border border-slate-300"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.legalName}</div>
                        <div className="text-xs text-slate-400">
                          {[c.city, c.state].filter(Boolean).join(', ') || c.pan || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.contactEmail}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-medium',
                            c.source === 'DIRECTORY' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {c.source === 'DIRECTORY' ? 'Directory' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(c)}
                              title="Edit candidate"
                              className={cn(
                                'rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-100',
                              )}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemove(c)}
                            disabled={!canRemove}
                            title={canRemove ? 'Remove candidate' : "Invited candidates can't be removed"}
                            className={cn(
                              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                              canRemove ? 'text-rose-600 hover:bg-rose-50' : 'cursor-not-allowed text-slate-300',
                            )}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
