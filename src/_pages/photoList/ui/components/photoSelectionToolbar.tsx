import { useId } from 'react';

import { BULK_DOWNLOAD_LIMIT } from '@/features/photoList';
import { Button } from '@/shared/ui/button';
import { DownloadIcon, TrashIcon } from '@/shared/ui/icons';

export type PhotoSelectionToolbarProps = {
  disabled: boolean;
  downloadLimitExceeded: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  onDownload: () => void;
  onDelete: () => void;
};

export function PhotoSelectionToolbar({
  disabled,
  downloadLimitExceeded,
  isDownloading,
  isDeleting,
  onDownload,
  onDelete,
}: PhotoSelectionToolbarProps) {
  const downloadLimitId = useId();
  const actionsDisabled = disabled || isDownloading || isDeleting;

  return (
    <div
      role="toolbar"
      aria-label="선택한 사진 작업"
      className="bg-surface border-border-subtle grid grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <Button
        variant="secondary"
        disabled={actionsDisabled || downloadLimitExceeded}
        aria-describedby={downloadLimitExceeded ? downloadLimitId : undefined}
        isLoading={isDownloading}
        loadingText="다운로드 중…"
        onClick={onDownload}
      >
        <DownloadIcon aria-hidden="true" size="17" /> 다운로드
      </Button>
      <Button
        variant="destructive"
        disabled={actionsDisabled}
        isLoading={isDeleting}
        loadingText="삭제 중…"
        onClick={onDelete}
      >
        <TrashIcon aria-hidden="true" size="17" /> 삭제
      </Button>
      {downloadLimitExceeded && (
        <p id={downloadLimitId} className="text-muted col-span-2 text-center text-xs" role="status">
          한 번에 {BULK_DOWNLOAD_LIMIT}장까지 받을 수 있어요. 선택한 사진 수를 줄여주세요.
        </p>
      )}
    </div>
  );
}
