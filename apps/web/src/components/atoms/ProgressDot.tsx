import { cn } from '../ui.js';

interface ProgressDotProps {
  readonly state: 'done' | 'active' | 'pending';
  readonly size?: 'sm' | 'md';
}

export function ProgressDot({ state, size = 'md' }: ProgressDotProps): React.ReactElement {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  if (state === 'done') {
    return (
      <div className={cn('flex items-center justify-center rounded-full bg-emerald-500 text-white', sizeClass)}>
        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    );
  }
  if (state === 'active') {
    return <div className={cn('rounded-full border-2 border-indigo-500 bg-white', sizeClass)} />;
  }
  return <div className={cn('rounded-full border-2 border-slate-300 bg-white', sizeClass)} />;
}
