import { useState } from 'react';
import { cn } from '../ui.js';

interface TooltipProps {
  readonly content: string;
  readonly children: React.ReactNode;
  readonly side?: 'top' | 'bottom';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={cn(
          'absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg',
          side === 'top' ? 'bottom-full left-1/2 mb-1 -translate-x-1/2' : 'top-full left-1/2 mt-1 -translate-x-1/2',
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
