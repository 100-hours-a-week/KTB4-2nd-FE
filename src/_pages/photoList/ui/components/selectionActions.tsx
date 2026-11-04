'use client';

import { createPortal } from 'react-dom';

import { PhotoSelectionProgress } from '@/features/photoList/ui/photoSelectionProgress';

import { PhotoSelectionToolbar, type PhotoSelectionToolbarProps } from './photoSelectionToolbar';

export function SelectionActions({
  disabled,
  downloadLimitExceeded,
  isDownloading,
  isDeleting,
  onDownload,
  onDelete,
  selectingAll,
}: PhotoSelectionToolbarProps & {
  selectingAll?: { loadedCount: number; onCancel: () => void };
}) {
  if (typeof document === 'undefined') return null;

  if (selectingAll) return <PhotoSelectionProgress {...selectingAll} />;

  return createPortal(
    <div className="fixed right-0 bottom-[var(--app-vertical-offset,0px)] left-0 z-30 mx-auto w-full max-w-[430px] shadow-navigation">
      <PhotoSelectionToolbar
        disabled={disabled}
        downloadLimitExceeded={downloadLimitExceeded}
        isDownloading={isDownloading}
        isDeleting={isDeleting}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    </div>,
    document.body,
  );
}
