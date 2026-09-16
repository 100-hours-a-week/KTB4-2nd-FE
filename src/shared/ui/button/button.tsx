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
        rounded-2px bg-[#021730] px-6 py-3 text-base font-semibold text-white
        transition-colors enabled:cursor-pointer
        enabled:hover:bg-[#132c49] enabled:active:bg-[#010e1e]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#021730]
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
