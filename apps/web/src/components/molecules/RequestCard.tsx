import { Link } from 'react-router-dom';
import type { RequirementSummary } from '@vendor-management/shared';
import { Card } from '../ui.js';
import { Badge } from '../atoms/Badge.js';
import { Icon } from '../atoms/Icon.js';
import { MiniPipeline } from './MiniPipeline.js';
import { formatDate } from '../../lib/format.js';
import { getStatusLabel, getStatusVariant } from '../../lib/stage.js';

interface RequestCardProps {
  readonly requirement: RequirementSummary;
  readonly index: number;
}

export function RequestCard({ requirement: r, index }: RequestCardProps): React.ReactElement {
  const whoseCourtIcon = r.whoseCourt === 'Vendor' ? 'file-text' : r.whoseCourt === 'Done' ? 'check' : 'users';

  return (
    <Link
      to={`/requests/${r.id}`}
      className="animate-reveal block"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div>
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
              <Badge variant={getStatusVariant(r.status)}>
                {getStatusLabel(r.status)}
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
