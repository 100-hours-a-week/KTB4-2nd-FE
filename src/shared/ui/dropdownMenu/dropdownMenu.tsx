'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type DropdownMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  dividerBefore?: boolean;
};

export type DropdownMenuProps = {
  items: readonly DropdownMenuItem[];
  label?: string;
  align?: 'left' | 'right';
  trigger?: ReactNode;
  className?: string;
};

export function DropdownMenu({
  items,
  label = '메뉴 열기',
  align = 'right',
  trigger,
  className = '',
}: DropdownMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));

  useEffect(() => {
    if (!isOpen) return;

    itemRefs.current[enabledIndexes[0]]?.focus();

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [enabledIndexes, isOpen]);

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const focusItem = (currentIndex: number, direction: 1 | -1) => {
    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    const nextPosition =
      (enabledPosition + direction + enabledIndexes.length) % enabledIndexes.length;
    itemRefs.current[enabledIndexes[nextPosition]]?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    setIsOpen(true);
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(index, event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const targetIndex = event.key === 'Home' ? enabledIndexes[0] : enabledIndexes.at(-1);
      if (targetIndex != null) itemRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className="hover:bg-brand/5 focus-visible:outline-brand inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-brand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {trigger ?? <MoreIcon />}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`rounded-control bg-surface absolute top-full z-50 mt-2 min-w-44 overflow-hidden border border-slate-200 py-1 shadow-[0_10px_30px_rgba(2,23,48,0.14)] ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={item.dividerBefore ? 'border-t border-slate-100 pt-1' : ''}
            >
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
                onClick={() => {
                  item.onSelect();
                  closeAndRestoreFocus();
                }}
                className={`flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition-colors
                  ${item.destructive ? 'text-danger hover:bg-red-50' : 'text-brand hover:bg-brand/5'}
                  disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
                `}
              >
                {item.icon && <span className="inline-flex size-5 shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
