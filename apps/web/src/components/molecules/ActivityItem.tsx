import { Icon } from '../atoms/Icon.js';
import { cn } from '../ui.js';

interface ActivityItemProps {
  readonly action: string;
  readonly message: string;
  readonly timestamp: string;
  readonly isLast?: boolean;
}

export function ActivityItem({ action, message, timestamp, isLast }: ActivityItemProps): React.ReactElement {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100">
          <Icon name="check" size={12} className="text-slate-500" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200" />}
      </div>
      <div className={cn('pb-4', isLast && 'pb-0')}>
        <p className="text-sm text-slate-900">{message}</p>
        <p className="mt-0.5 text-xs text-slate-400">{new Date(timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}
