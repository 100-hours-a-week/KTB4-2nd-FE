'use client';

import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useModal } from '@/shared/ui/dialog';

import styles from './bottomSheet.module.css';

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, description, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useModal(open, onClose, panelRef);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-(--layer-overlay) flex items-end justify-center">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-[color-mix(in_srgb,var(--brand)_55%,transparent)] ${styles.backdrop}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`bg-surface shadow-dialog relative flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-sheet outline-none ${styles.panel}`}
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-slate-200"
        />
        <div className="shrink-0 px-5 pt-4">
          <h2 id={titleId} className="text-brand text-section-title wrap-break-word">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-muted text-description mt-1 wrap-break-word">
              {description}
            </p>
          )}
        </div>
        <div className="min-h-0 overflow-y-auto px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
