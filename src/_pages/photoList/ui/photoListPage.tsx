'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';

import {
  BULK_DOWNLOAD_LIMIT,
  PhotoArtwork,
  PhotoViewer,
  usePhotoDelete,
  usePhotoDownload,
  usePlacePhotos,
  type PhotoListItem,
} from '@/features/photoList';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

const LONG_PRESS_DELAY_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export type PhotoListPageProps = {
  tripId: number;
  tripPlaceId: number;
  tripName: string;
  placeName: string;
};

export function PhotoListPage({ tripId, tripPlaceId, tripName, placeName }: PhotoListPageProps) {
  const router = useRouter();
  const { photos, viewState, refetch } = usePlacePhotos(tripId, tripPlaceId);
  const { mutate: requestDownload, isPending: isDownloading } = usePhotoDownload();
  const { mutate: requestDelete, isPending: isDeleting } = usePhotoDelete(tripId, tripPlaceId);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const activeIndex = photos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = activeIndex >= 0 ? photos[activeIndex] : null;
  const selectedCount = selectedIds.size;
  const allSelected = photos.length > 0 && selectedCount === photos.length;

  function leaveSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function togglePhoto(photoId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function selectPhotoFromLongPress(photoId: number) {
    setSelectionMode(true);
    setSelectedIds((current) => new Set(current).add(photoId));
  }

  function confirmDelete() {
    requestDelete(pendingDeleteIds, {
      onSuccess: () => {
        setActivePhotoId(null);
        leaveSelectionMode();
      },
    });
    setPendingDeleteIds([]);
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/trips/${tripId}`);
  }

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-dvh w-full max-w-[430px] px-4 pt-[max(20px,env(safe-area-inset-top))] pb-8">
      <PhotoListHeader
        placeName={placeName}
        selectionMode={selectionMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onBack={handleBack}
        onEnterSelection={() => setSelectionMode(true)}
        onCancelSelection={leaveSelectionMode}
        onToggleAll={() =>
          setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
        }
      />

      <p className="text-muted mt-1 text-[11px]">
        {tripName}
        {viewState === 'ready' &&
          ` · ${selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장`}`}
      </p>

      {viewState !== 'ready' ? (
        <PhotoGridSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      ) : photos.length === 0 ? (
        <EmptyPhotoList onAdd={() => toast.warning('아직 지원하지 않는 기능이에요.')} />
      ) : (
        <ul
          aria-label="사진 목록"
          className={`mt-3 grid grid-cols-3 gap-1 ${selectionMode ? 'pb-20' : ''}`}
        >
          {photos.map((photo, index) => {
            const selected = selectedIds.has(photo.id);
            return (
              <li key={photo.id}>
                <PhotoGridItem
                  photo={photo}
                  index={index}
                  selectionMode={selectionMode}
                  selected={selected}
                  onActivate={() =>
                    selectionMode ? togglePhoto(photo.id) : setActivePhotoId(photo.id)
                  }
                  onLongPress={() => selectPhotoFromLongPress(photo.id)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {selectionMode && photos.length > 0 && (
        <SelectionActions
          disabled={selectedCount === 0 || isDownloading || isDeleting}
          downloadLimitExceeded={selectedCount > BULK_DOWNLOAD_LIMIT}
          isDownloading={isDownloading}
          onDownload={() => requestDownload([...selectedIds])}
          onDelete={() => setPendingDeleteIds([...selectedIds])}
        />
      )}

      {activePhoto && (
        <PhotoViewer
          photo={activePhoto}
          current={activeIndex + 1}
          total={photos.length}
          tripName={tripName}
          placeName={placeName}
          onClose={() => setActivePhotoId(null)}
          onPrevious={() =>
            setActivePhotoId(photos[(activeIndex - 1 + photos.length) % photos.length].id)
          }
          onNext={() => setActivePhotoId(photos[(activeIndex + 1) % photos.length].id)}
          onDownload={() => requestDownload([activePhoto.id])}
          onDelete={() => setPendingDeleteIds([activePhoto.id])}
        />
      )}

      <Dialog
        destructive
        open={pendingDeleteIds.length > 0}
        onClose={() => setPendingDeleteIds([])}
        title={
          pendingDeleteIds.length > 1
            ? `사진 ${pendingDeleteIds.length}장을 삭제하시겠습니까?`
            : '사진을 삭제하시겠습니까?'
        }
        description="삭제 후에는 되돌릴 수 없습니다."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setPendingDeleteIds([])}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            className="min-h-11 w-full px-0 text-sm"
          >
            삭제하기
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

function PhotoGridItem({
  photo,
  index,
  selectionMode,
  selected,
  onActivate,
  onLongPress,
}: {
  photo: PhotoListItem;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  onActivate: () => void;
  onLongPress: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const longPressTriggeredRef = useRef(false);

  function cancelLongPress() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cancelLongPress, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (selectionMode || event.button !== 0) return;

    cancelLongPress();
    longPressTriggeredRef.current = false;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      longPressTriggeredRef.current = true;
      onLongPress();
    }, LONG_PRESS_DELAY_MS);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const movedX = Math.abs(event.clientX - startPointRef.current.x);
    const movedY = Math.abs(event.clientY - startPointRef.current.y);
    if (movedX > LONG_PRESS_MOVE_TOLERANCE_PX || movedY > LONG_PRESS_MOVE_TOLERANCE_PX) {
      cancelLongPress();
    }
  }

  function handleClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onActivate();
  }

  return (
    <button
      type="button"
      aria-label={
        selectionMode
          ? `${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`
          : `${index + 1}번째 사진 보기`
      }
      aria-pressed={selectionMode ? selected : undefined}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
    >
      <PhotoArtwork photo={photo} />
      {selectionMode && <SelectionMark selected={selected} />}
    </button>
  );
}

function PhotoListHeader({
  placeName,
  selectionMode,
  selectedCount,
  allSelected,
  onBack,
  onEnterSelection,
  onCancelSelection,
  onToggleAll,
}: {
  placeName: string;
  selectionMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  onBack: () => void;
  onEnterSelection: () => void;
  onCancelSelection: () => void;
  onToggleAll: () => void;
}) {
  return (
    <header className="grid min-h-12 grid-cols-[64px_1fr_64px] items-center">
      {selectionMode ? (
        <button
          type="button"
          onClick={onCancelSelection}
          className="focus-visible:outline-brand justify-self-start rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
        >
          취소
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          aria-label="여행 상세로 돌아가기"
          className="hover:bg-brand/5 focus-visible:outline-brand grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2"
        >
          <BackIcon />
        </button>
      )}

      <h1 className="truncate text-center text-[17px] font-extrabold">
        {selectionMode ? `${selectedCount}장 선택됨` : placeName}
      </h1>

      <button
        type="button"
        onClick={selectionMode ? onToggleAll : onEnterSelection}
        className="focus-visible:outline-brand justify-self-end rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
      >
        {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
      </button>
    </header>
  );
}

function SelectionActions({
  disabled,
  downloadLimitExceeded,
  isDownloading,
  onDownload,
  onDelete,
}: {
  disabled: boolean;
  downloadLimitExceeded: boolean;
  isDownloading: boolean;
  onDownload: () => void;
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
        disabled={disabled || downloadLimitExceeded}
        aria-describedby={downloadLimitExceeded ? 'bulk-download-limit' : undefined}
        isLoading={isDownloading}
        onClick={onDownload}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <DownloadIcon /> 다운로드
      </Button>
      <Button
        variant="destructive"
        disabled={disabled}
        onClick={onDelete}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <TrashIcon /> 삭제
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
          <span className="flex-1">사진을 가져오지 못했어요.</span>
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

function EmptyPhotoList({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <EmptyImageIcon />
      </span>
      <h2 className="mt-4 text-base font-extrabold">폴더에 사진이 없어요</h2>
      <p className="text-muted mt-1 text-xs">사진을 추가해보세요!</p>
      <Button onClick={onAdd} className="mt-5 min-h-10 rounded-full px-5 text-sm">
        ＋ 사진 추가
      </Button>
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
function DownloadIcon() {
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
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
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
