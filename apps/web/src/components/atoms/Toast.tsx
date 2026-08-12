import { useEffect } from 'react';
import { cn } from '../ui.js';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly onClose: () => void;
  readonly duration?: number;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  info: 'bg-slate-800',
};

export function Toast({ message, variant = 'info', onClose, duration = 4000 }: ToastProps): React.ReactElement {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg', VARIANT_CLASSES[variant])}>
      {message}
    </div>
  );
}
