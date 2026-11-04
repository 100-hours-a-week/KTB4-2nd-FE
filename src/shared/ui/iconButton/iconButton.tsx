'use client';

import type { ComponentPropsWithRef } from 'react';

export type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'aria-label' | 'children'> & {
  'aria-label': string;
  tone?: 'default' | 'inverse';
  children: React.ReactNode;
};

export function IconButton({
  children,
  className = '',
  tone = 'default',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-grid size-11 shrink-0 place-items-center rounded-full enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-(--motion-normal) ${tone === 'inverse' ? 'text-white hover:text-white focus-visible:outline-white aria-pressed:bg-white/20' : 'text-muted hover:text-brand focus-visible:outline-brand aria-pressed:bg-surface-subtle aria-pressed:text-brand'} ${className}`}
    >
      {children}
    </button>
  );
}
