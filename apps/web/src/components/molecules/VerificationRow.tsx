import { Icon } from '../atoms/Icon.js';
import { Badge } from '../atoms/Badge.js';
import { cn } from '../ui.js';

interface VerificationRowProps {
  readonly type: string;
  readonly description: string;
  readonly status: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral'; icon: 'check-circle' | 'alert-triangle' | 'x-circle' | 'clock' }> = {
  RUNNING: { label: 'Running', variant: 'neutral', icon: 'clock' },
  PASSED: { label: 'Passed', variant: 'success', icon: 'check-circle' },
  FAILED: { label: 'Failed', variant: 'danger', icon: 'x-circle' },
  NEEDS_REVIEW: { label: 'Needs review', variant: 'warning', icon: 'alert-triangle' },
  ACCEPTED: { label: 'Accepted', variant: 'success', icon: 'check-circle' },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: 'x-circle' },
};

export function VerificationRow({ type, description, status }: VerificationRowProps): React.ReactElement {
  const s = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <Icon name={s.icon} size={20} className={cn(s.variant === 'success' ? 'text-emerald-500' : s.variant === 'warning' ? 'text-amber-500' : s.variant === 'danger' ? 'text-rose-500' : 'text-slate-400')} />
        <div>
          <p className="font-medium text-slate-900">{type}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
    </div>
  );
}
