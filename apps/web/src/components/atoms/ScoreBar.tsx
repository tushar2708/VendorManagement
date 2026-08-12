import { cn } from '../ui.js';

interface ScoreBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly color?: string;
  readonly className?: string;
}

export function ScoreBar({ value, max = 100, label, color = 'bg-indigo-500', className }: ScoreBarProps): React.ReactElement {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-700">{value}</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
