'use client';

import { useId, type ComponentPropsWithRef } from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> & {
  label?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  options: readonly SelectOption[];
};

export function Select({
  id,
  label,
  helperText,
  error,
  placeholder = '선택해주세요.',
  options,
  disabled,
  required,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const message = error || helperText;
  const messageId = `${selectId}-message`;
  const describedBy = `${ariaDescribedBy ?? ''} ${message ? messageId : ''}`.trim();

  return (
    <div className="bg-surface flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={selectId} className="text-brand text-sm font-semibold">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger ml-1">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={`
          border-field-border relative flex items-center border-b-2
          transition-colors focus-within:border-brand focus-within:shadow-[0_1px_0_0_var(--brand)]
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <select
          {...props}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          className={`
            text-brand min-h-12 w-full appearance-none border-0 bg-transparent py-3 pr-10 pl-0
            text-base outline-none disabled:cursor-not-allowed
            ${className}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

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
          className="text-field-border pointer-events-none absolute right-2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`flex items-start gap-2 text-sm ${error ? 'text-danger' : 'text-field-border'}`}
        >
          {error && <span aria-hidden="true">*</span>}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
