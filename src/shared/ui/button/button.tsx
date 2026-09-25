'use client';

import type { ComponentPropsWithRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white enabled:hover:bg-brand-hover enabled:active:bg-brand-active focus-visible:outline-brand',
  secondary:
    'bg-surface-subtle text-brand enabled:hover:bg-surface-subtle-hover enabled:active:bg-border-subtle focus-visible:outline-brand',
  destructive:
    'bg-danger-strong text-white enabled:hover:bg-danger-strong-hover enabled:active:bg-danger-strong-active focus-visible:outline-danger-strong',
  ghost:
    'bg-transparent text-muted enabled:hover:bg-surface-subtle enabled:hover:text-brand focus-visible:outline-brand',
};

export function Button({
  children,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText = '처리 중…',
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex min-h-12 items-center justify-center
        rounded-control px-6 py-3 text-base font-semibold
        transition-[background-color,transform,opacity] duration-200 ease-out enabled:cursor-pointer
        enabled:active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClassName[variant]}
        ${className}
      `}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
