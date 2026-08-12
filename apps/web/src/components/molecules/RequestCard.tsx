import { Link } from 'react-router-dom';
import type { RequirementSummary } from '@vendor-management/shared';
import { Card, cn } from '../ui.js';
import { Badge } from '../atoms/Badge.js';
import { Icon } from '../atoms/Icon.js';
import { MiniPipeline } from './MiniPipeline.js';
import { formatDate } from '../../lib/format.js';
import { useHoverScale } from '../../hooks/use-hover-scale.js';

interface RequestCardProps {
  readonly requirement: RequirementSummary;
  readonly index: number;
}

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  CANDIDATES_SELECTED: 'info',
  INVITES_DISPATCHED: 'info',
  PREQUAL_IN_PROGRESS: 'warning',
  PREQUAL_COMPLETE: 'warning',
  AWARDED: 'success',
  FULL_PACK_SUBMITTED: 'info',
  DEEP_VERIFICATION: 'warning',
  APPROVALS_IN_PROGRESS: 'warning',
  CONTRACT_REVIEW: 'info',
  ERP_PUSH: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  CANDIDATES_SELECTED: 'Candidates selected',
  INVITES_DISPATCHED: 'Invites sent',
  PREQUAL_IN_PROGRESS: 'Pre-qualification in progress',
  PREQUAL_COMPLETE: 'Pre-qualification complete',
  AWARDED: 'Awarded',
  FULL_PACK_SUBMITTED: 'Full pack submitted',
  DEEP_VERIFICATION: 'Deep verification',
  APPROVALS_IN_PROGRESS: 'Approvals in progress',
  CONTRACT_REVIEW: 'Contract review',
  ERP_PUSH: 'ERP push',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function RequestCard({ requirement: r, index }: RequestCardProps): React.ReactElement {
  const whoseCourtIcon = r.whoseCourt === 'Vendor' ? 'file-text' : r.whoseCourt === 'Done' ? 'check' : 'users';
  const cardRef = useHoverScale<HTMLDivElement>(1.015);

  return (
    <Link
      to={`/requests/${r.id}`}
      className="animate-reveal block"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div ref={cardRef}>
        <Card className="p-5 transition-all hover:border-indigo-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {r.partCategory ? `${r.partCategory} · ` : ''}opened {formatDate(r.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Icon name={whoseCourtIcon} size={14} />
                {r.whoseCourt}
              </span>
              <Badge variant={STATUS_BADGE_VARIANT[r.status] ?? 'neutral'}>
                {STATUS_LABEL[r.status] ?? r.status}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <MiniPipeline status={r.status} />
          </div>
        </Card>
      </div>
    </Link>
  );
}
