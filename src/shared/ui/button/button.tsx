'use client';

import type { ComponentPropsWithRef } from 'react';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  isLoading?: boolean;
  loadingText?: string;
};

export function Button({
  children,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText = '처리 중…',
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
        rounded-control bg-brand px-6 py-3 text-base font-semibold text-white
        transition-[background-color,transform,opacity] duration-200 ease-out enabled:cursor-pointer
        enabled:hover:bg-brand-hover enabled:active:scale-[0.98] enabled:active:bg-brand-active
        focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
