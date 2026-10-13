'use client';

import { useState } from 'react';

import { useTripPlaceFolders } from '@/features/tripDetail';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';

type RestorePlaceDialogProps = {
  open: boolean;
  tripId: number;
  photoCount: number;
  isRestoring: boolean;
  onClose: () => void;
  onConfirm: (tripPlaceId: number) => void;
};

export function RestorePlaceDialog({ open, ...props }: RestorePlaceDialogProps) {
  if (!open) return null;
  return <RestorePlaceDialogContent {...props} />;
}

function RestorePlaceDialogContent({
  tripId,
  photoCount,
  isRestoring,
  onClose,
  onConfirm,
}: Omit<RestorePlaceDialogProps, 'open'>) {
  const { folders, viewState, refetch } = useTripPlaceFolders(tripId);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <Dialog
      open
      size="wide"
      onClose={() => !isRestoring && onClose()}
      title="어느 폴더로 되돌릴까요?"
      description={`장소를 알 수 없는 사진 ${photoCount}장을 되돌릴 폴더를 골라주세요.`}
    >
      {viewState === 'loading' ? (
        <div role="status" aria-label="장소 폴더 불러오는 중" className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : viewState === 'error' ? (
        <div role="alert" className="py-4 text-center">
          <p className="text-muted mb-3 text-xs">장소 폴더를 불러오지 못했어요.</p>
          <Button variant="secondary" onClick={() => void refetch()} className="text-sm">
            다시 시도
          </Button>
        </div>
      ) : folders.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">되돌릴 장소 폴더가 없어요.</p>
      ) : (
        <fieldset className="max-h-64 space-y-2 overflow-y-auto text-left">
          <legend className="sr-only">되돌릴 장소 폴더</legend>
          {folders.map((folder) => (
            <label
              key={folder.id}
              className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors ${selectedId === folder.id ? 'border-brand bg-surface-subtle' : 'border-border-subtle'}`}
            >
              <span className="min-w-0">
                <strong className="text-brand block truncate text-sm font-bold">
                  {folder.name}
                </strong>
                <span className="text-muted block text-[11px]">{folder.photoCount}장</span>
              </span>
              <input
                type="radio"
                name="restore-place"
                value={folder.id}
                checked={selectedId === folder.id}
                onChange={() => setSelectedId(folder.id)}
                className="checked:border-brand focus-visible:outline-brand size-5 shrink-0 appearance-none rounded-full border-2 border-slate-300 bg-white checked:border-[6px] focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            </label>
          ))}
        </fieldset>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isRestoring}
          className="min-h-11 w-full px-0 text-sm"
        >
          취소
        </Button>
        <Button
          disabled={selectedId === null}
          isLoading={isRestoring}
          onClick={() => selectedId !== null && onConfirm(selectedId)}
          className="min-h-11 w-full px-0 text-sm"
        >
          되돌리기
        </Button>
      </div>
    </Dialog>
  );
}
