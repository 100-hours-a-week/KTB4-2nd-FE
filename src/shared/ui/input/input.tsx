'use client';

import { useId, type ComponentPropsWithRef } from 'react';

import { WarningIcon } from '@/shared/ui/icons';

export type InputProps = ComponentPropsWithRef<'input'> & {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'underline' | 'boxed';
  characterCount?: number;
  characterLimit?: number;
};

export function Input({
  id,
  type = 'text',
  label,
  helperText,
  error,
  variant = 'underline',
  characterCount,
  characterLimit,
  value,
  maxLength,
  disabled,
  required,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error || helperText;
  const messageId = `${inputId}-message`;
  const countId = `${inputId}-count`;
  const count = characterCount ?? (value != null ? String(value).length : undefined);
  const limit = characterLimit ?? maxLength;
  const showCount = limit != null && count != null;
  const describedBy =
    `${ariaDescribedBy ?? ''} ${message ? messageId : ''} ${showCount ? countId : ''}`.trim();
  const isBoxed = variant === 'boxed';

  return (
    <div className="bg-surface flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-brand text-label">
          {label}
        </label>
      )}
      <div
        className={`
          border-field-border relative flex min-h-control-md items-center gap-3
          focus-within:border-brand motion-safe:transition-colors
          motion-safe:duration-(--motion-normal) motion-safe:ease-(--motion-ease-out)
          ${
            isBoxed
              ? 'rounded-control border-2 px-4 focus-within:shadow-[0_0_0_1px_var(--brand)]'
              : 'border-b-2 focus-within:shadow-[0_1px_0_0_var(--brand)]'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          {...props}
          id={inputId}
          type={type}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          className={`
            min-w-0 flex-1 rounded-none border-0 bg-transparent px-0
            text-brand placeholder:text-muted text-body py-2 outline-none
            disabled:text-muted disabled:cursor-not-allowed
            ${className}
          `}
        />
        {showCount && (
          <span
            id={countId}
            className={`text-field-border text-label shrink-0 tabular-nums ${isBoxed ? '' : 'pr-2'}`}
          >
            {count}/{limit}
          </span>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`flex items-start gap-2 text-description ${error ? 'text-danger-strong' : 'text-field-border'}`}
        >
          {error && (
            <WarningIcon
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              size="20"
              variant="input"
            />
          )}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
