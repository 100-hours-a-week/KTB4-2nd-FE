'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children' | 'multiple'> & {
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
  value,
  defaultValue,
  onChange,
  onBlur,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-options`;
  const message = error || helperText;
  const messageId = `${selectId}-message`;
  const labelId = `${selectId}-label`;
  const describedBy = `${ariaDescribedBy ?? ''} ${message ? messageId : ''}`.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(String(value ?? defaultValue ?? ''));
  const [activeIndex, setActiveIndex] = useState(-1);
  const currentValue = value === undefined ? selectedValue : String(value);
  const selectedOption = options.find((option) => option.value === currentValue);

  const setNativeRef = useCallback(
    (element: HTMLSelectElement | null) => {
      nativeSelectRef.current = element;
      if (typeof ref === 'function') ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  useEffect(() => {
    if (value === undefined && nativeSelectRef.current) {
      setSelectedValue(nativeSelectRef.current.value);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  const openList = (direction: 1 | -1 = 1) => {
    const selectedIndex = options.findIndex(
      (option) => option.value === currentValue && !option.disabled,
    );
    const firstEnabled = options.findIndex((option) => !option.disabled);
    const lastEnabled = options.findLastIndex((option) => !option.disabled);
    setActiveIndex(
      selectedIndex >= 0 ? selectedIndex : direction === 1 ? firstEnabled : lastEnabled,
    );
    setIsOpen(true);
  };

  const selectOption = (option: SelectOption) => {
    if (option.disabled) return;
    const nativeSelect = nativeSelectRef.current;
    if (nativeSelect) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      setter?.call(nativeSelect, option.value);
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    setSelectedValue(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    const enabledIndexes = options.flatMap((option, index) => (option.disabled ? [] : [index]));
    if (enabledIndexes.length === 0) return;
    const position = enabledIndexes.indexOf(activeIndex);
    const next = (position + direction + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[next]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) moveActive(event.key === 'ArrowDown' ? 1 : -1);
      else openList(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (isOpen && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveIndex(
        event.key === 'Home'
          ? options.findIndex((option) => !option.disabled)
          : options.findLastIndex((option) => !option.disabled),
      );
      return;
    }
    if (isOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsOpen(false);
    if (nativeSelectRef.current) {
      onBlur?.({ target: nativeSelectRef.current } as FocusEvent<HTMLSelectElement>);
    }
  };

  return (
    <div ref={containerRef} onBlur={handleBlur} className="bg-surface flex w-full flex-col gap-2">
      {label && (
        <label id={labelId} htmlFor={selectId} className="text-brand text-sm font-semibold">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          {...props}
          ref={setNativeRef}
          id={`${selectId}-native`}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            setSelectedValue(event.target.value);
            onChange?.(event);
          }}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-label={label ?? placeholder}
          aria-labelledby={label ? labelId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy || undefined}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => (isOpen ? setIsOpen(false) : openList())}
          onKeyDown={handleKeyDown}
          className={`border-field-border focus-visible:border-brand text-brand flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-b-2 bg-transparent py-3 text-left text-base outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className={selectedOption ? '' : 'text-muted'}>
            {selectedOption?.label ?? placeholder}
          </span>
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
            className={`text-field-border shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className="rounded-control bg-surface absolute top-full z-20 mt-2 max-h-60 w-full overflow-y-auto border border-slate-200 py-1 shadow-[0_12px_30px_rgba(2,23,48,0.14)]"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                id={`${selectId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={currentValue === option.value}
                disabled={option.disabled}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={`text-brand flex min-h-11 w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activeIndex === index ? 'bg-brand/5' : 'hover:bg-brand/5'} ${currentValue === option.value ? 'font-semibold' : ''}`}
              >
                {option.label}
                {currentValue === option.value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`flex items-start gap-2 text-sm ${error ? 'text-danger' : 'text-field-border'}`}
        >
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
