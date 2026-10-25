'use client';

import { createPortal } from 'react-dom';

import { BULK_DOWNLOAD_LIMIT } from '@/features/photoList';
import { Button } from '@/shared/ui/button';
import { DownloadIcon, TrashIcon } from '@/shared/ui/icons';

export function SelectionActions({
  disabled,
  downloadLimitExceeded,
  isDownloading,
  onDownload,
  onDelete,
  selectingAll,
}: {
  disabled: boolean;
  downloadLimitExceeded: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onDelete: () => void;
  selectingAll?: { loadedCount: number; onCancel: () => void };
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role={selectingAll ? 'region' : 'toolbar'}
      aria-label={selectingAll ? '전체 선택 진행 안내' : '선택한 사진 작업'}
      className={
        selectingAll
          ? 'fixed right-4 bottom-[calc(var(--app-vertical-offset)+16px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto max-w-[398px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.10)]'
          : 'bg-surface border-border-subtle fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(2,23,48,0.08)]'
      }
    >
      {selectingAll ? (
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
            <p className="mt-1 text-xs text-slate-500">
              사진 {selectingAll.loadedCount}장 불러왔어요
            </p>
            <p id="select-all-cancel-help" className="sr-only">
              완료되면 전체 사진이 선택됩니다. 취소해도 기존 선택은 유지됩니다.
            </p>
          </div>
          <button
            type="button"
            aria-label="불러오기 취소"
            aria-describedby="select-all-cancel-help"
            className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            onClick={selectingAll.onCancel}
          >
            취소
          </button>
        </div>
      ) : (
        <>
          <Button
            variant="secondary"
            disabled={disabled || downloadLimitExceeded}
            aria-describedby={downloadLimitExceeded ? 'bulk-download-limit' : undefined}
            isLoading={isDownloading}
            onClick={onDownload}
            className="min-h-11 gap-2 px-2 text-sm"
          >
            <DownloadIcon size="17" /> 다운로드
          </Button>
          <Button
            variant="destructive"
            disabled={disabled}
            onClick={onDelete}
            className="min-h-11 gap-2 px-2 text-sm"
          >
            <TrashIcon size="17" /> 삭제
          </Button>
          {downloadLimitExceeded && (
            <p
              id="bulk-download-limit"
              className="text-muted col-span-2 text-center text-xs"
              role="status"
            >
              한 번에 {BULK_DOWNLOAD_LIMIT}장까지 받을 수 있어요. 선택한 사진 수를 줄여주세요.
            </p>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
