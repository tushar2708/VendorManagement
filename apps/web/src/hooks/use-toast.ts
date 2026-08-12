import { useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  readonly message: string;
  readonly variant: ToastVariant;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToast({ message, variant });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
