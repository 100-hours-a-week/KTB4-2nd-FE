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
        <label htmlFor={inputId} className="text-brand text-sm font-semibold">
          {label}
        </label>
      )}
      <div
        className={`
          border-field-border relative flex gap-3 transition-colors focus-within:border-brand
          ${
            isBoxed
              ? 'min-h-24 items-start rounded-control border-2 px-4 py-3 focus-within:shadow-[0_0_0_1px_var(--brand)]'
              : 'items-center border-b-2 focus-within:shadow-[0_1px_0_0_var(--brand)]'
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
            text-brand placeholder:text-muted text-base outline-none
            disabled:text-muted disabled:cursor-not-allowed
            ${isBoxed ? 'min-h-16 py-0 pr-10 pb-7' : 'min-h-12 py-3'}
            ${className}
          `}
        />
        {showCount && (
          <span
            id={countId}
            className={`text-field-border shrink-0 text-sm font-semibold tabular-nums ${
              isBoxed ? 'absolute right-3 bottom-3' : 'pr-2'
            }`}
          >
            {count}/{limit}
          </span>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`flex items-start gap-2 text-sm ${error ? 'text-danger' : 'text-field-border'}`}
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
