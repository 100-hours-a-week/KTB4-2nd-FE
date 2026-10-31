'use client';

import { useId } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/shared/ui/button';

type PhotoSelectionProgressProps = {
  loadedCount: number;
  onCancel: () => void;
};

export function PhotoSelectionProgress({ loadedCount, onCancel }: PhotoSelectionProgressProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed right-4 bottom-[calc(var(--app-vertical-offset,0px)+16px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto max-w-[398px]">
      <PhotoSelectionProgressPanel loadedCount={loadedCount} onCancel={onCancel} />
    </div>,
    document.body,
  );
}

export function PhotoSelectionProgressPanel({
  loadedCount,
  onCancel,
}: PhotoSelectionProgressProps) {
  const cancelHelpId = useId();

  return (
    <div
      role="region"
      aria-label="전체 선택 진행 안내"
      className="border-border-subtle bg-surface rounded-card border p-4 shadow-menu"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0faf4]"
        >
          <span className="size-[18px] animate-spin rounded-full border-2 border-[#cdebd8] border-t-[#03a94d] motion-reduce:animate-none" />
        </span>
        <div className="min-w-0 flex-1">
          <p role="status" className="text-sm font-bold text-slate-900">
            전체 선택 중
          </p>
          <p className="mt-1 text-xs text-slate-500">사진 {loadedCount}장 불러왔어요</p>
          <p id={cancelHelpId} className="sr-only">
            완료되면 전체 사진이 선택됩니다. 취소해도 기존 선택은 유지됩니다.
          </p>
        </div>
        <Button
          variant="secondary"
          aria-label="불러오기 취소"
          aria-describedby={cancelHelpId}
          className="shrink-0"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
