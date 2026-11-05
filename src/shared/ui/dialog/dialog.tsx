'use client';

import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useModal } from './useModal';

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

  useModal(open, onClose, panelRef);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-(--layer-overlay) flex items-center justify-center overflow-y-auto px-6 py-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--brand)_55%,transparent)]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role={destructive ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`bg-surface rounded-sheet shadow-dialog relative max-h-[calc(100dvh-48px)] w-full overflow-y-auto px-5 pt-6 pb-5 text-center outline-none ${size === 'wide' ? 'max-w-[380px]' : 'max-w-[300px]'}`}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="bg-surface-subtle text-muted mx-auto mb-4 grid size-14 place-items-center rounded-full"
          >
            {icon}
          </span>
        )}
        <h2 id={titleId} className="text-brand text-section-title wrap-break-word">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-muted text-description mt-2 wrap-break-word">
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
  return (
    <div className="grid grid-cols-2 gap-2 [&>button]:min-w-0 [&>button]:w-full [&>button]:px-3">
      {children}
    </div>
  );
}
