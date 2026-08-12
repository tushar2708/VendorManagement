import { cn } from '../ui.js';

interface FunnelStep {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

interface FunnelChartProps {
  readonly steps: FunnelStep[];
  readonly className?: string;
}

export function FunnelChart({ steps, className }: FunnelChartProps): React.ReactElement {
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3">
          <span className="w-36 text-right text-sm text-slate-600 shrink-0">{step.name}</span>
          <div className="flex-1 h-7 rounded bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded transition-all duration-700"
              style={{ width: `${(step.value / max) * 100}%`, backgroundColor: step.color }}
            />
          </div>
          <span className="w-8 text-sm font-semibold text-slate-700">{step.value}</span>
        </div>
      ))}
    </div>
  );
}
