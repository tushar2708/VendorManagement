import { Link } from 'react-router-dom';
import type { RequirementSummary } from '@vendor-management/shared';
import { Card } from '../ui.js';
import { Badge } from '../atoms/Badge.js';
import { formatDate } from '../../lib/format.js';
import { getStatusLabel, getStatusVariant } from '../../lib/stage.js';

interface RequestCardProps {
  readonly requirement: RequirementSummary;
  readonly index: number;
}

export function RequestCard({ requirement: r, index }: RequestCardProps): React.ReactElement {
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
            <div className="shrink-0">
              <Badge variant={getStatusVariant(r.stage)}>
                {getStatusLabel(r.stage)}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
}
