import { cn } from '../ui.js';

interface ShimmerProps {
  readonly width?: string;
  readonly height?: string;
  readonly className?: string;
}

export function Shimmer({ width, height, className }: ShimmerProps): React.ReactElement {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      style={{ width, height }}
    />
  );
}
