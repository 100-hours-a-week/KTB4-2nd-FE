'use client';

import { useId, type ComponentPropsWithRef } from 'react';

export type ToggleProps = Omit<ComponentPropsWithRef<'input'>, 'type'> & {
  label?: string;
  description?: string;
};

export function Toggle({
  id,
  label,
  description,
  disabled,
  className = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const descriptionId = `${inputId}-description`;
  const labelledBy = `${ariaLabelledBy ?? ''} ${label ? labelId : ''}`.trim();
  const describedBy = `${ariaDescribedBy ?? ''} ${description ? descriptionId : ''}`.trim();

  return (
    <label
      htmlFor={inputId}
      className={`flex min-h-12 items-center justify-between gap-4 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
    >
      {(label || description) && (
        <span className="flex min-w-0 flex-col gap-1">
          {label && (
            <span id={labelId} className="text-brand text-base font-semibold">
              {label}
            </span>
          )}
          {description && (
            <span id={descriptionId} className="text-muted text-sm leading-5">
              {description}
            </span>
          )}
        </span>
      )}

      <input
        {...props}
        id={inputId}
        type="checkbox"
        role="switch"
        disabled={disabled}
        aria-labelledby={labelledBy || undefined}
        aria-describedby={describedBy || undefined}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="peer-checked:bg-brand peer-checked:[&>span]:translate-x-5 peer-focus-visible:ring-brand/60 relative h-8 w-13 shrink-0 rounded-full bg-slate-300 motion-safe:transition-colors motion-safe:duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
      >
        <span className="absolute top-1 left-1 size-6 rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-200" />
      </span>
    </label>
  );
}
