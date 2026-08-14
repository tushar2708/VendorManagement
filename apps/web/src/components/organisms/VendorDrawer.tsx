import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import {
  getBuyerLink, runCheck, resolveCheck, requestChanges,
  reviewClear, reviewReject, awardLink, advanceToContracts,
  pushErp, retryErp, erpPackUrl,
} from '../../lib/buyer-api.js';
import { fileUrl } from '../../lib/files-api.js';
import {
  LINK_STATE_META, CHECK_META, PREQUAL_CHECKS, DEEP_CHECKS,
} from '@vendor-management/shared';
import type { BuyerLinkDetail } from '@vendor-management/shared';
import { Badge } from '../atoms/Badge.js';
import { Button, Card, Spinner, cn } from '../ui.js';
import { useToast } from '../atoms/Toast.js';
import { getStatusLabel, getStatusVariant } from '../../lib/stage.js';
import { track } from '../../lib/analytics.js';

interface VendorDrawerProps {
  readonly linkId: string;
  readonly onClose: () => void;
}

export function VendorDrawer({ linkId, onClose }: VendorDrawerProps): React.ReactElement {
  const [detail, setDetail] = useState<BuyerLinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const toast = useToast();

  // Review decision form state
  const [reviewScore, setReviewScore] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [requestChangesReason, setRequestChangesReason] = useState('');

  // Track which actions are in flight
  const actionInFlight = useRef<string | null>(null);
  // Fire vendor_drawer_opened once per open, not on every 3s poll.
  const openTracked = useRef(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await getBuyerLink(linkId);
      setDetail(data);
      if (!openTracked.current) {
        openTracked.current = true;
        track('vendor_drawer_opened', {
          link_id: linkId,
          vendor_name: data.candidate.legalName ?? '',
          link_state: data.state,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch vendor link detail:', err);
      toast.error('Failed to load vendor details');
      setLoading(false);
    }
  }, [linkId, toast]);

  // Polling
  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleRunCheck = useCallback(async (checkType: string) => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = checkType;
    setIsActing(true);

    try {
      await runCheck(linkId, checkType);
      toast.info(`Running ${checkType} check...`);
      await fetchDetail();
    } catch (err) {
      console.error(`Failed to run ${checkType} check:`, err);
      toast.error(`Failed to run ${checkType} check`);
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  const handleResolveCheck = useCallback(async (checkId: string, action: 'accept' | 'reject') => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = `resolve-${checkId}`;
    setIsActing(true);

    try {
      await resolveCheck(linkId, checkId, action);
      toast.success(`Check ${action}ed successfully`);
      await fetchDetail();
    } catch (err) {
      console.error(`Failed to ${action} check:`, err);
      toast.error(`Failed to ${action} check`);
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  const handleRequestChanges = useCallback(async () => {
    if (!requestChangesReason.trim() || actionInFlight.current || isActing) return;
    actionInFlight.current = 'request-changes';
    setIsActing(true);

    try {
      await requestChanges(linkId, requestChangesReason);
      toast.success('Changes requested successfully');
      setRequestChangesReason('');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to request changes:', err);
      toast.error('Failed to request changes');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, requestChangesReason, isActing, toast, fetchDetail]);

  const handleReviewClear = useCallback(async () => {
    const score = parseInt(reviewScore, 10);
    if (Number.isNaN(score) || score < 0 || score > 100 || actionInFlight.current || isActing) return;
    actionInFlight.current = 'review-clear';
    setIsActing(true);

    try {
      await reviewClear(linkId, score);
      toast.success('Vendor cleared successfully');
      setReviewScore('');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to clear vendor:', err);
      toast.error('Failed to clear vendor');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, reviewScore, isActing, toast, fetchDetail]);

  const handleReviewReject = useCallback(async () => {
    if (!rejectReason.trim() || actionInFlight.current || isActing) return;
    actionInFlight.current = 'review-reject';
    setIsActing(true);

    try {
      await reviewReject(linkId, rejectReason);
      toast.success('Vendor rejected successfully');
      setRejectReason('');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to reject vendor:', err);
      toast.error('Failed to reject vendor');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, rejectReason, isActing, toast, fetchDetail]);

  const handleAwardLink = useCallback(async () => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = 'award';
    setIsActing(true);

    try {
      await awardLink(linkId);
      toast.success('Vendor awarded successfully');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to award vendor:', err);
      toast.error('Failed to award vendor');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  const handleAdvanceToContracts = useCallback(async () => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = 'advance';
    setIsActing(true);

    try {
      await advanceToContracts(linkId);
      toast.success('Vendor advanced to contracts');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to advance vendor:', err);
      toast.error('Failed to advance vendor');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  const handlePushErp = useCallback(async () => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = 'push-erp';
    setIsActing(true);

    try {
      await pushErp(linkId);
      toast.info('Pushing to ERP...');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to push to ERP:', err);
      toast.error('Failed to push to ERP');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  const handleRetryErp = useCallback(async () => {
    if (actionInFlight.current || isActing) return;
    actionInFlight.current = 'retry-erp';
    setIsActing(true);

    try {
      await retryErp(linkId);
      toast.info('Retrying ERP sync...');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to retry ERP:', err);
      toast.error('Failed to retry ERP');
    } finally {
      actionInFlight.current = null;
      setIsActing(false);
    }
  }, [linkId, isActing, toast, fetchDetail]);

  if (loading && !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
        <p className="text-slate-600">Failed to load vendor details</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div
        className="relative w-[480px] bg-white h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {detail.candidate.legalName || 'Vendor'}
              </h2>
              <p className="text-sm text-slate-500">{detail.candidate.contactEmail}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={getStatusVariant(detail.state)}>
                  {getStatusLabel(detail.state)}
                </Badge>
                {detail.prequalScore !== null && (
                  <span className="text-sm font-medium text-slate-600">
                    Score: {detail.prequalScore}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Submitted Fields */}
          {Object.keys(detail.fields).length > 0 && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Submitted Fields
              </h3>
              <div className="space-y-3">
                {Object.entries(detail.fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm font-medium text-slate-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-slate-900">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Documents */}
          {detail.documents.length > 0 && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Documents
              </h3>
              <div className="space-y-2">
                {detail.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <a
                      href={fileUrl(doc.fileBlobId)}
                      download={doc.fileName}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 truncate"
                    >
                      {doc.fileName}
                    </a>
                    <Badge variant={doc.status === 'ACCEPTED' ? 'success' : doc.status === 'REJECTED' ? 'danger' : 'neutral'}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verification Checks */}
          {detail.checks.length > 0 && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Verification Checks
              </h3>
              <div className="space-y-3">
                {detail.checks.map((check) => {
                  const checkLabel = CHECK_META[check.checkType]?.label || check.checkType;
                  return (
                    <Card key={check.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-slate-900">{checkLabel}</p>
                          {check.matchScore !== null && (
                            <p className="text-sm text-slate-500">
                              Match: {check.matchScore}%
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {check.status === 'RUNNING' && <Spinner className="h-4 w-4" />}
                          <Badge
                            variant={
                              check.status === 'PASSED' || check.status === 'ACCEPTED'
                                ? 'success'
                                : check.status === 'FAILED' || check.status === 'REJECTED'
                                  ? 'danger'
                                  : check.status === 'NEEDS_REVIEW'
                                    ? 'warning'
                                    : 'neutral'
                            }
                          >
                            {check.status}
                          </Badge>
                        </div>
                      </div>

                      {check.status === 'NEEDS_REVIEW' && (
                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResolveCheck(check.id, 'accept')}
                            disabled={isActing}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResolveCheck(check.id, 'reject')}
                            disabled={isActing}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {check.status !== 'PASSED'
                        && check.status !== 'ACCEPTED'
                        && check.status !== 'RUNNING'
                        && check.status !== 'NEEDS_REVIEW'
                        && check.status !== 'FAILED'
                        && check.status !== 'REJECTED'
                        && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRunCheck(check.checkType)}
                            disabled={isActing}
                            className="mt-2"
                          >
                            Run Check
                          </Button>
                        )}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Review Decision */}
          {detail.state === 'PREQUAL_UNDER_REVIEW' && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Review Decision
              </h3>
              <Card className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Score (0-100)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="Enter score"
                    />
                    <Button
                      size="sm"
                      onClick={handleReviewClear}
                      disabled={isActing || !reviewScore.trim()}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rejection Reason
                  </label>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="Reason for rejection..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleReviewReject}
                      disabled={isActing || !rejectReason.trim()}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Request Changes
                  </label>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={requestChangesReason}
                      onChange={(e) => setRequestChangesReason(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="What needs to change..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleRequestChanges}
                      disabled={isActing || !requestChangesReason.trim()}
                    >
                      Request Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Award */}
          {detail.state === 'PREQUAL_CLEARED' && (
            <section>
              <Button
                onClick={handleAwardLink}
                disabled={isActing}
                className="w-full"
              >
                Award this Vendor
              </Button>
            </section>
          )}

          {/* Advance */}
          {detail.state === 'FULL_UNDER_REVIEW' && (
            <section>
              <Button
                onClick={handleAdvanceToContracts}
                disabled={isActing}
                className="w-full"
              >
                Advance to Contracts
              </Button>
            </section>
          )}

          {/* Review Tasks */}
          {detail.reviewTasks.length > 0 && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Review Tasks
              </h3>
              <div className="space-y-3">
                {detail.reviewTasks.map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {task.stage.toLowerCase().replace(/_/g, ' ')}
                        </p>
                        {task.slaHours && (
                          <p className="text-sm text-slate-500">
                            SLA: {task.slaHours} hours
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          task.status === 'APPROVED'
                            ? 'success'
                            : task.status === 'CHANGES_REQUESTED'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Contracts */}
          {detail.contracts.length > 0 && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                Contracts
              </h3>
              <div className="space-y-3">
                {detail.contracts.map((contract) => (
                  <Card key={contract.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-slate-900 capitalize">
                        {contract.contractType.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <Badge variant={getStatusVariant(contract.state)}>
                        {contract.state.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {contract.versions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-medium">Versions:</p>
                        {contract.versions.map((version) => (
                          <a
                            key={version.id}
                            href={fileUrl(version.fileBlobId)}
                            download={version.fileName}
                            className="block text-sm text-indigo-600 hover:text-indigo-700 truncate"
                          >
                            v{version.versionNo} - {version.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Quotation Data - TODO: implement when API provides this data */}
          {/* Governance Summary - TODO: implement when API provides this data */}

          {/* ERP Section */}
          {['APPROVED', 'ERP_SYNCING', 'ONBOARDED', 'ERP_FAILED'].includes(detail.state) && (
            <section>
              <h3 className="mb-4 text-base font-semibold text-slate-900">
                ERP Integration
              </h3>
              <Card className="p-4">
                {detail.state === 'APPROVED' && (
                  <Button
                    onClick={handlePushErp}
                    disabled={isActing}
                    className="w-full"
                  >
                    Push to ERP
                  </Button>
                )}

                {detail.state === 'ERP_SYNCING' && (
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm">Syncing...</span>
                  </div>
                )}

                {detail.state === 'ERP_FAILED' && (
                  <Button
                    onClick={handleRetryErp}
                    disabled={isActing}
                    className="w-full"
                  >
                    Retry ERP
                  </Button>
                )}

                {detail.state === 'ONBOARDED' && (
                  <div className="space-y-3">
                    {detail.erpVendorCode && (
                      <div>
                        <p className="text-sm text-slate-600">Vendor Code:</p>
                        <p className="font-medium text-slate-900">{detail.erpVendorCode}</p>
                      </div>
                    )}
                    <a
                      href={erpPackUrl(linkId)}
                      download
                      className="inline-flex items-center justify-center w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      Download ERP Pack
                    </a>
                  </div>
                )}
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
