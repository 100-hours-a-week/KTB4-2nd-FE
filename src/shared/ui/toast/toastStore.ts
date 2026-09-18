'use client';

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastState = {
  toasts: ToastItem[];
  add: (toast: ToastItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;
let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, toast].slice(-MAX_TOASTS),
    })),
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

function showToast(message: string, options: ToastOptions = {}) {
  const id = `toast-${Date.now()}-${toastId++}`;

  useToastStore.getState().add({
    id,
    message,
    variant: options.variant ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION,
  });

  return id;
}

type VariantOptions = Omit<ToastOptions, 'variant'>;

export const toast = {
  show: showToast,
  success: (message: string, options?: VariantOptions) =>
    showToast(message, { ...options, variant: 'success' }),
  error: (message: string, options?: VariantOptions) =>
    showToast(message, { ...options, variant: 'error' }),
  info: (message: string, options?: VariantOptions) =>
    showToast(message, { ...options, variant: 'info' }),
  warning: (message: string, options?: VariantOptions) =>
    showToast(message, { ...options, variant: 'warning' }),
  dismiss: (id?: string) => {
    if (id) {
      useToastStore.getState().remove(id);
      return;
    }

    useToastStore.getState().clear();
  },
};
