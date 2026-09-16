'use client';

import { useEffect } from 'react';

import { type ToastItem, useToastStore } from './toast-store';

const variantStyle: Record<ToastItem['variant'], string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-brand',
  warning: 'border-l-warning',
};

function ToastMessage({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((state) => state.remove);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const timeoutId = window.setTimeout(() => remove(toast.id), toast.duration);
    return () => window.clearTimeout(timeoutId);
  }, [remove, toast.duration, toast.id]);

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`rounded-control bg-surface text-brand flex min-h-14 items-center gap-3 border border-slate-200 border-l-4 px-4 py-3 shadow-lg ${variantStyle[toast.variant]}`}
    >
      <p className="min-w-0 flex-1 text-sm font-medium break-words">{toast.message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => remove(toast.id)}
        className="text-muted hover:text-brand focus-visible:outline-brand shrink-0 cursor-pointer rounded-[4px] px-1 text-xl leading-none focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ×
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-label="알림"
      className="pointer-events-none fixed top-6 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-3"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastMessage toast={toast} />
        </div>
      ))}
    </div>
  );
}
