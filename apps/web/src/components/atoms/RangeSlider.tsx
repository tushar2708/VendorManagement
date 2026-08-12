import { cn } from '../ui.js';

interface RangeSliderProps {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly onChange: (value: number) => void;
  readonly label?: string;
  readonly showValue?: boolean;
  readonly className?: string;
}

export function RangeSlider({ value, min = 0, max = 100, step = 1, onChange, label, showValue = true, className }: RangeSliderProps): React.ReactElement {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-slate-600">{label}</span>}
          {showValue && <span className="font-medium text-slate-900">{value}%</span>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
        style={{ background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)` }}
      />
    </div>
  );
}
