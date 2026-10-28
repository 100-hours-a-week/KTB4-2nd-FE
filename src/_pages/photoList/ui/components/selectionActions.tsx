'use client';

import { createPortal } from 'react-dom';

import { BULK_DOWNLOAD_LIMIT } from '@/features/photoList';
import { PhotoSelectionProgress } from '@/features/photoList/ui/photoSelectionProgress';
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

  if (selectingAll) return <PhotoSelectionProgress {...selectingAll} />;

  return createPortal(
    <div
      role="toolbar"
      aria-label="선택한 사진 작업"
      className="bg-surface border-border-subtle fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(2,23,48,0.08)]"
    >
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
    </div>,
    document.body,
  );
}
