'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import type { PhotoAccent, PhotoListItem } from '@/features/photoList';
import {
  UNCLASSIFIED_ISSUE_LABEL,
  useDeleteUnclassifiedPhotos,
  useRestoreUnclassifiedPhotos,
  useUnclassifiedPhotos,
  type UnclassifiedIssue,
} from '@/features/unclassifiedPhotos';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';

export type UnclassifiedPhotoListPageProps = {
  tripId: number;
  tripName: string;
  issue: UnclassifiedIssue;
};

export function UnclassifiedPhotoListPage({
  tripId,
  tripName,
  issue,
}: UnclassifiedPhotoListPageProps) {
  const router = useRouter();
  const { photos, viewState, refetch } = useUnclassifiedPhotos(tripId, issue);
  const { mutate: requestRestore, isPending: isRestoring } = useRestoreUnclassifiedPhotos(tripId);
  const { mutate: requestDelete, isPending: isDeleting } = useDeleteUnclassifiedPhotos(tripId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const visibleSelectedIds = photos
    .filter((photo) => selectedIds.has(photo.id))
    .map((photo) => photo.id);
  const selectedCount = visibleSelectedIds.length;
  const allSelected = photos.length > 0 && selectedCount === photos.length;
  const label = UNCLASSIFIED_ISSUE_LABEL[issue];

  function togglePhoto(photoId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/trips/${tripId}/unclassified?trip=${encodeURIComponent(tripName)}`);
  }

  function restoreSelected() {
    requestRestore(
      { photoIds: visibleSelectedIds },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }

  function confirmDelete() {
    requestDelete(visibleSelectedIds, {
      onSuccess: () => setSelectedIds(new Set()),
      onSettled: () => setDeleteOpen(false),
    });
  }

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-dvh w-full max-w-[430px] px-4 pt-[max(20px,env(safe-area-inset-top))] pb-8">
      <header className="grid min-h-12 grid-cols-[64px_1fr_64px] items-center">
        <button
          type="button"
          onClick={handleBack}
          aria-label="미분류 폴더로 돌아가기"
          className="hover:bg-brand/5 focus-visible:outline-brand grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2"
        >
          <BackIcon />
        </button>

        <h1 className="truncate text-center text-[17px] font-extrabold">{label}</h1>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
            }
            className="focus-visible:outline-brand justify-self-end rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
          >
            {allSelected ? '선택 취소' : '전체 선택'}
          </button>
        )}
      </header>

      <p className="text-muted mt-1 text-[11px]">
        {tripName}
        {viewState === 'ready' &&
          ` · ${selectedCount > 0 ? `선택된 사진 ${selectedCount}장` : `사진 ${photos.length}장`}`}
      </p>

      {viewState !== 'ready' ? (
        <PhotoGridSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      ) : photos.length === 0 ? (
        <EmptyPhotoList />
      ) : (
        <ul aria-label={`${label} 목록`} className="mt-3 grid grid-cols-3 gap-1 pb-20">
          {photos.map((photo, index) => {
            const selected = selectedIds.has(photo.id);
            return (
              <li key={photo.id}>
                <button
                  type="button"
                  aria-label={`${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`}
                  aria-pressed={selected}
                  onClick={() => togglePhoto(photo.id)}
                  className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
                >
                  <PhotoArtwork photo={photo} />
                  <SelectionMark selected={selected} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {viewState === 'ready' && photos.length > 0 && (
        <SelectionActions
          disabled={selectedCount === 0 || isRestoring || isDeleting}
          isRestoring={isRestoring}
          onRestore={restoreSelected}
          onDelete={() => setDeleteOpen(true)}
        />
      )}

      <Dialog
        destructive
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        title={
          selectedCount > 1
            ? `사진 ${selectedCount}장을 삭제하시겠습니까?`
            : '정말 삭제하시겠습니까?'
        }
        description="삭제 후에는 되돌릴 수 없습니다."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setDeleteOpen(false)}
            disabled={isDeleting}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            isLoading={isDeleting}
            className="min-h-11 w-full px-0 text-sm"
          >
            삭제하기
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

function SelectionActions({
  disabled,
  isRestoring,
  onRestore,
  onDelete,
}: {
  disabled: boolean;
  isRestoring: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="선택한 사진 작업"
      className="bg-surface border-border-subtle fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(2,23,48,0.08)]"
    >
      <Button
        variant="secondary"
        disabled={disabled}
        isLoading={isRestoring}
        onClick={onRestore}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <RestoreIcon /> 해제
      </Button>
      <Button
        variant="destructive"
        disabled={disabled}
        onClick={onDelete}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <TrashIcon /> 삭제
      </Button>
    </div>,
    document.body,
  );
}

function PhotoGridSkeleton({ showError, onRetry }: { showError: boolean; onRetry: () => void }) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '사진 불러오는 중'}
      aria-busy={!showError}
    >
      <div className="mt-3 grid grid-cols-3 gap-1">
        {Array.from({ length: 18 }).map((_, index) => (
          <Skeleton
            key={index}
            animation={showError ? 'none' : 'breathe'}
            delayMs={(index % 3) * 120 + Math.floor(index / 3) * 60}
            className="aspect-square w-full rounded-[5px]"
          />
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-4 bottom-[calc(var(--app-vertical-offset)+20px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto flex max-w-[398px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <span className="flex-1">사진 로드에 실패했어요.</span>
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-bold text-[#a9c8ff] hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyPhotoList() {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <EmptyImageIcon />
      </span>
      <h2 className="mt-4 text-base font-extrabold">폴더에 사진이 없어요</h2>
      <p className="text-muted mt-1 text-xs">확인할 사진을 모두 정리했어요.</p>
    </section>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full border-2 text-[11px] font-bold ${selected ? 'border-brand bg-brand text-white' : 'border-white bg-black/15 text-transparent'}`}
    >
      ✓
    </span>
  );
}

function PhotoArtwork({ photo }: { photo: PhotoListItem }) {
  if (photo.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-full bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(photo.thumbnailUrl)})` }}
      />
    );
  }

  const accentClass: Record<PhotoAccent, string> = {
    coast: 'from-[#cee7f0] via-[#70abc5] to-[#e6d6a5]',
    night: 'from-[#34476f] via-[#1d2c50] to-[#0e1a2e]',
    blossom: 'from-[#d9edf3] via-[#f4b9ca] to-[#8fb77b]',
    sunset: 'from-[#1d2945] via-[#293657] to-[#f1a456]',
    island: 'from-[#acd8ee] via-[#80b76d] to-[#407a3d]',
    desert: 'from-[#f4d9ad] via-[#d77b46] to-[#a94728]',
  };

  return (
    <span
      aria-hidden="true"
      className={`relative block size-full overflow-hidden bg-gradient-to-b ${accentClass[photo.accent]}`}
    >
      <span className="absolute top-[14%] right-[14%] size-[17%] rounded-full bg-[#ffe59a]" />
      <span className="absolute -right-[8%] bottom-[-10%] h-[42%] w-[82%] rounded-[50%] bg-black/15" />
      <span className="absolute bottom-[-13%] -left-[10%] h-[48%] w-[92%] rounded-[50%] bg-white/18" />
    </span>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function RestoreIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />
    </svg>
  );
}
function EmptyImageIcon() {
  return (
    <svg
      aria-hidden="true"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </svg>
  );
}
