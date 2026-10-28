'use client';

import { createPortal } from 'react-dom';

export function PhotoSelectionProgress({
  loadedCount,
  onCancel,
}: {
  loadedCount: number;
  onCancel: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="region"
      aria-label="전체 선택 진행 안내"
      className="fixed right-4 bottom-[calc(var(--app-vertical-offset)+16px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto max-w-[398px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.10)]"
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
          <p id="select-all-cancel-help" className="sr-only">
            완료되면 전체 사진이 선택됩니다. 취소해도 기존 선택은 유지됩니다.
          </p>
        </div>
        <button
          type="button"
          aria-label="불러오기 취소"
          aria-describedby="select-all-cancel-help"
          className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}
