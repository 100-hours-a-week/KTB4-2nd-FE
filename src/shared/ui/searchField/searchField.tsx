'use client';

import { useId, useRef, type ComponentPropsWithRef } from 'react';

import { CloseIcon, SearchIcon } from '@/shared/ui/icons';
import { IconButton } from '@/shared/ui/iconButton';

export type SearchFieldProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'value' | 'onChange' | 'ref'
> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  showSearchIcon?: boolean;
  error?: string;
};

export function SearchField({
  label,
  value,
  onValueChange,
  showSearchIcon = false,
  error,
  disabled,
  id,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const description = [describedBy, error ? errorId : undefined].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div
        className={`bg-surface flex min-h-[52px] items-center gap-2.5 rounded-card border pr-1 pl-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)] focus-within:border-brand motion-safe:transition-colors ${error ? 'border-danger-strong' : 'border-border-subtle'} ${disabled ? 'opacity-50' : ''}`}
      >
        {showSearchIcon && (
          <span aria-hidden="true" className="text-muted shrink-0">
            <SearchIcon strokeWidth="2" strokeLinecap="round" size={19} />
          </span>
        )}
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : invalid}
          aria-describedby={description || undefined}
          className="text-brand placeholder:text-muted/70 min-w-0 flex-1 bg-transparent py-3 text-sm font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && !disabled && (
          <IconButton
            aria-label="검색어 지우기"
            onClick={() => {
              onValueChange('');
              inputRef.current?.focus();
            }}
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-slate-100"
            >
              <CloseIcon strokeWidth="2.6" strokeLinecap="round" size="12" />
            </span>
          </IconButton>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-danger-strong mt-2 px-1 text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
