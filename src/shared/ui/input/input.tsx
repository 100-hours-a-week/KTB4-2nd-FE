'use client';

import { useId, type ComponentPropsWithRef } from 'react';

export type InputProps = ComponentPropsWithRef<'input'> & {
  label?: string;
  helperText?: string;
  error?: string;
  /** register 사용 시 useWatch로 구독한 문자열의 length를 전달합니다. */
  characterCount?: number;
};

export function Input({
  id,
  type = 'text',
  label,
  helperText,
  error,
  characterCount,
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
  const showCount = maxLength != null && count != null;
  const describedBy =
    `${ariaDescribedBy ?? ''} ${message ? messageId : ''} ${showCount ? countId : ''}`.trim();

  return (
    <div className="bg-surface flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-brand text-sm font-semibold">
          {label}
        </label>
      )}
      <div
        className={`
          border-field-border flex items-center gap-3 border-b-2
          transition-colors focus-within:border-brand focus-within:shadow-[0_1px_0_0_var(--brand)]
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
            min-h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-3
            text-brand placeholder:text-muted text-base outline-none
            disabled:text-muted disabled:cursor-not-allowed
            ${className}
          `}
        />
        {showCount && (
          <span
            id={countId}
            className="text-field-border shrink-0 pr-2 text-base font-semibold tabular-nums"
          >
            {count}/{maxLength}
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
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4m0 3h.01" />
            </svg>
          )}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
