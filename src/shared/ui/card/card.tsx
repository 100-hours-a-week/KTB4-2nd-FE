import type { ComponentPropsWithRef, ElementType } from 'react';

export type CardVariant = 'subtle' | 'outlined';

export type CardProps = ComponentPropsWithRef<'div'> & {
  /** subtle: 배경만 채운 패널, outlined: 흰 배경에 테두리만 둔 패널. */
  variant?: CardVariant;
  as?: ElementType;
};

const variantClassName: Record<CardVariant, string> = {
  subtle: 'bg-surface-subtle',
  outlined: 'bg-surface border border-border-subtle',
};

export function Card({ variant = 'subtle', as, className = '', ...props }: CardProps) {
  const Component = as ?? 'div';

  return (
    <Component {...props} className={`rounded-card ${variantClassName[variant]} ${className}`} />
  );
}
