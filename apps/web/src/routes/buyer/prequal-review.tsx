import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { DocumentResponse } from '@vendor-management/shared';
import {
  getVerificationChecks,
  overrideCheck,
  getVendorDocuments,
  downloadDocumentUrl,
  prequalDecision,
} from '../../lib/vendors-api.js';
import { errorMessage } from '../../lib/auth-api.js';
import { Button, Card, Spinner, cn } from '../../components/ui.js';
import { Badge } from '../../components/atoms/Badge.js';
import { RangeSlider } from '../../components/atoms/RangeSlider.js';
import { VerificationCheckRow } from '../../components/molecules/VerificationCheckRow.js';
import { useTextReveal } from '../../hooks/use-text-reveal.js';
import { Icon } from '../../components/atoms/Icon.js';

interface VerificationCheck {
  readonly id: string;
  readonly checkType: string;
  readonly status: string;
  readonly matchScore: number | null;
  readonly detail: unknown;
  readonly ranAt: string | null;
}

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | {
      readonly kind: 'ready';
      readonly checks: VerificationCheck[];
      readonly documents: DocumentResponse[];
    };

export function PrequalReviewPage(): React.ReactElement {
  const { id = '', vendorId = '' } = useParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [qualityScore, setQualityScore] = useState(50);
  const [riskScore, setRiskScore] = useState(50);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headingRef = useTextReveal<HTMLHeadingElement>();

  useEffect(() => {
    setState({ kind: 'loading' });
    Promise.all([getVerificationChecks(vendorId), getVendorDocuments(vendorId)])
      .then(([checks, documents]) => setState({ kind: 'ready', checks, documents }))
      .catch((error: unknown) =>
        setState({ kind: 'error', message: errorMessage(error, 'Could not load prequalification data.') })
      );
  }, [vendorId]);

  async function handleOverrideCheck(checkId: string, action: 'accept' | 'reject'): Promise<void> {
    try {
      await overrideCheck(vendorId, checkId, action);
      if (state.kind === 'ready') {
        const updated = state.checks.map((c) =>
          c.id === checkId ? { ...c, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : c
        );
        setState({ kind: 'ready', checks: updated, documents: state.documents });
      }
    } catch (error: unknown) {
      console.error('Failed to override check:', error);
    }
  }

  async function handleDecision(decision: 'clear' | 'reject'): Promise<void> {
    try {
      setIsSubmitting(true);
      const weightedScore = Math.round((qualityScore * 0.6 + (100 - riskScore) * 0.4));
      await prequalDecision(vendorId, {
        decision,
        qualityScore,
        riskScore,
        weightedScore,
        notes,
        vendorId,
      });
      setState({ kind: 'ready', checks: [], documents: [] });
    } catch (error: unknown) {
      console.error('Failed to submit decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function reload(): void {
    setState({ kind: 'loading' });
    Promise.all([getVerificationChecks(vendorId), getVendorDocuments(vendorId)])
      .then(([checks, documents]) => setState({ kind: 'ready', checks, documents }))
      .catch((error: unknown) =>
        setState({ kind: 'error', message: errorMessage(error, 'Could not load prequalification data.') })
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

  const { checks, documents } = state;
  const weightedScore = Math.round(qualityScore * 0.6 + (100 - riskScore) * 0.4);
  const completedChecks = checks.filter(
    (c) => c.status === 'PASSED' || c.status === 'ACCEPTED' || c.status === 'REJECTED'
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">
            Prequalification review
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify vendor information and make a qualification decision.
          </p>
        </div>
        <Link to={`/requests/${id}`}>
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      {/* Verification Checks Section */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Verification checks</h2>
            <p className="mt-1 text-sm text-slate-500">Review automated and manual verification results.</p>
          </div>
          <Badge variant="info">
            {completedChecks} of {checks.length} checks
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {checks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No verification checks available</p>
          ) : (
            checks.map((check) => (
              <VerificationCheckRow
                key={check.id}
                check={check}
                onOverride={(action) => handleOverrideCheck(check.id, action)}
              />
            ))
          )}
        </div>
      </Card>

      {/* Documents Section */}
      <Card className="mt-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Vendor documents</h2>
          <p className="mt-1 text-sm text-slate-500">Download and review submitted documents.</p>
        </div>

        <div className="mt-4">
          {documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No documents submitted</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={downloadDocumentUrl(vendorId, doc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="file-text" size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate text-sm font-medium text-slate-900">{doc.fileName}</span>
                  </div>
                  <span className="text-xs text-slate-500">download →</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Score and Decide Section */}
      <Card className="mt-6 p-6 border-l-4 border-l-indigo-500 bg-indigo-50/20">
        <h2 className="text-lg font-semibold text-slate-900">Score and decide</h2>
        <p className="mt-1 text-sm text-slate-500">Assess quality and risk to finalize the prequalification.</p>

        <div className="mt-6 space-y-6">
          {/* Quality Score Slider */}
          <div>
            <label className="block text-sm font-medium text-slate-900">Quality score</label>
            <p className="mt-0.5 text-xs text-slate-500">Rate vendor capability and quality.</p>
            <div className="mt-2">
              <RangeSlider value={qualityScore} onChange={setQualityScore} label="Quality" min={0} max={100} />
            </div>
          </div>

          {/* Risk Score Slider */}
          <div>
            <label className="block text-sm font-medium text-slate-900">Risk score</label>
            <p className="mt-0.5 text-xs text-slate-500">Rate compliance and operational risk.</p>
            <div className="mt-2">
              <RangeSlider value={riskScore} onChange={setRiskScore} label="Risk" min={0} max={100} />
            </div>
          </div>

          {/* Weighted Score Display */}
          <div className="rounded-lg bg-white p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-600">Weighted score</span>
              <span className={cn(
                'text-3xl font-bold',
                weightedScore >= 70 && 'text-emerald-600',
                weightedScore >= 50 && weightedScore < 70 && 'text-amber-600',
                weightedScore < 50 && 'text-rose-600'
              )}>
                {weightedScore}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Quality 60% + Risk 40% = Weighted
            </p>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-900">Decision notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              rows={4}
              placeholder="Add notes about your decision, concerns, or conditions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleDecision('clear')}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? <Spinner className="h-4 w-4" /> : '✓ Clear'}
            </Button>
            <Button
              onClick={() => handleDecision('reject')}
              disabled={isSubmitting}
              variant="secondary"
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
