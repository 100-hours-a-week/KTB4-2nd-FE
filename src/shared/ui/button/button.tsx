'use client';

import type { ComponentPropsWithRef } from 'react';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
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

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'min-h-control-sm px-4 py-2 text-label',
  md: 'min-h-control-md px-6 py-3 text-body font-semibold',
  lg: 'min-h-control-lg px-6 py-4 text-body font-semibold',
};

export function Button({
  children,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText = '처리 중…',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? true : props['aria-busy']}
      className={`
        inline-flex items-center justify-center gap-2 rounded-control
        enabled:cursor-pointer motion-safe:transition-[background-color,transform,opacity]
        motion-safe:duration-(--motion-normal) motion-safe:ease-(--motion-ease-out)
        motion-safe:enabled:active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantClassName[variant]}
        ${sizeClassName[size]}
        ${className}
      `}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
