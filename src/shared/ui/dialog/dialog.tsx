'use client';

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  destructive?: boolean;
  size?: 'default' | 'wide';
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  destructive = false,
  size = 'default',
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // 포커스가 다이얼로그 밖으로 나가지 않도록 양 끝에서 순환시킵니다.
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-[var(--app-vertical-offset)] right-0 bottom-[var(--app-vertical-offset)] left-0 z-50 flex items-center justify-center px-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--brand)_55%,transparent)]"
      />
      <div
        ref={panelRef}
        role={destructive ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`bg-surface rounded-sheet relative w-full px-5 pt-6 pb-5 text-center shadow-[0_20px_48px_rgb(2_23_48_/_0.28)] ${size === 'wide' ? 'max-w-[380px]' : 'max-w-[300px]'}`}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="bg-surface-subtle text-muted mx-auto mb-4 grid size-14 place-items-center rounded-full"
          >
            {icon}
          </span>
        )}
        <h2 id={titleId} className="text-brand text-base font-bold tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-muted mt-2 text-[13px] leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
