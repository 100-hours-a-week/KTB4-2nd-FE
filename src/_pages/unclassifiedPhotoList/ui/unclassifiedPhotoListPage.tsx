'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { PhotoArtwork, PhotoViewer } from '@/features/photoList';
import {
  UNCLASSIFIED_ISSUE_LABEL,
  RestorePlaceDialog,
  RestorePlaceRequiredError,
  useDeleteUnclassifiedPhotos,
  useRestoreUnclassifiedPhotos,
  useUnclassifiedPhotos,
  type UnclassifiedIssue,
  type UnclassifiedPhoto,
} from '@/features/unclassifiedPhotos';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { ChevronLeftIcon, ImageIcon, RestoreIcon, TrashIcon } from '@/shared/ui/icons';
import { toast } from '@/shared/ui/toast';
import { PhotoSelectionProgress } from '@/features/photoList/ui/photoSelectionProgress';
import {
  PhotoGridSkeleton,
  PhotoGridSkeletonTiles,
} from '@/_pages/photoList/ui/components/photoGridSkeleton';

import { usePhotoListPosition } from '../lib/usePhotoListPosition';

export type UnclassifiedPhotoListPageProps = {
  tripId: number;
  tripName: string;
  issue: UnclassifiedIssue;
};

export function UnclassifiedPhotoListPage(props: UnclassifiedPhotoListPageProps) {
  return <UnclassifiedPhotoListContent key={`${props.tripId}:${props.issue}`} {...props} />;
}

function UnclassifiedPhotoListContent({ tripId, tripName, issue }: UnclassifiedPhotoListPageProps) {
  const router = useRouter();
  const {
    photos,
    viewState,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    isRefreshing,
    refreshError,
    nextPageError,
    invalidCursor,
    autoLoadEnabled,
    pageCount,
    loadNextPage,
    loadAllPhotos,
  } = useUnclassifiedPhotos(tripId, issue);
  const { mutate: requestRestore, isPending: isRestoring } = useRestoreUnclassifiedPhotos(tripId);
  const { mutate: requestDelete, isPending: isDeleting } = useDeleteUnclassifiedPhotos();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [placeRequest, setPlaceRequest] = useState<{
    photos: UnclassifiedPhoto[];
    photoCount: number;
  } | null>(null);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [navigationPending, setNavigationPending] = useState(false);
  const selectionRequest = useRef<AbortController | null>(null);
  const navigationRequest = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { mainRef, capture } = usePhotoListPosition(
    photos,
    isRestoring || isDeleting || isRefreshing,
  );

  useEffect(
    () => () => {
      selectionRequest.current?.abort();
      navigationRequest.current++;
    },
    [],
  );

  const activeIndex = photos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = photos[activeIndex];

  const visibleSelectedIds = photos
    .filter((photo) => selectedIds.has(photo.id))
    .map((photo) => photo.id);
  const selectedCount = visibleSelectedIds.length;
  const allSelected = !hasNextPage && photos.length > 0 && selectedCount === photos.length;
  const label = UNCLASSIFIED_ISSUE_LABEL[issue];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !hasNextPage ||
      isFetchingNextPage ||
      nextPageError ||
      !autoLoadEnabled ||
      isSelectingAll ||
      isRestoring ||
      isDeleting ||
      activePhotoId !== null ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    let root = sentinel.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY))
      root = root.parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNextPage().catch(() => {});
      },
      { root, rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasNextPage,
    isFetchingNextPage,
    nextPageError,
    autoLoadEnabled,
    isSelectingAll,
    isRestoring,
    isDeleting,
    activePhotoId,
    pageCount,
    loadNextPage,
  ]);

  function cancelSelectAll() {
    selectionRequest.current?.abort();
    selectionRequest.current = null;
    setIsSelectingAll(false);
  }

  async function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    if (!hasNextPage) {
      setSelectedIds(new Set(photos.map((photo) => photo.id)));
      return;
    }
    if (selectionRequest.current) return;
    const controller = new AbortController();
    selectionRequest.current = controller;
    setIsSelectingAll(true);
    try {
      const allPhotos = await loadAllPhotos(controller.signal);
      if (!controller.signal.aborted) setSelectedIds(new Set(allPhotos.map((photo) => photo.id)));
    } catch {
      if (!controller.signal.aborted)
        toast.error('전체 사진을 불러오지 못했어요. 기존 선택은 유지됩니다.');
    } finally {
      if (selectionRequest.current === controller) {
        selectionRequest.current = null;
        setIsSelectingAll(false);
      }
    }
  }

  function openPhoto(id: number | null) {
    navigationRequest.current++;
    setNavigationPending(false);
    setActivePhotoId(id);
  }

  async function nextPhoto() {
    if (navigationPending || activePhotoId === null) return;
    if (activeIndex < photos.length - 1) {
      openPhoto(photos[activeIndex + 1].id);
      return;
    }
    if (!hasNextPage) {
      openPhoto(photos[0].id);
      return;
    }
    const token = ++navigationRequest.current;
    const currentId = activePhotoId;
    setNavigationPending(true);
    try {
      const nextPhotos = await loadNextPage();
      if (navigationRequest.current !== token) return;
      const index = nextPhotos.findIndex((photo) => photo.id === currentId);
      const next = nextPhotos[index + 1];
      if (index >= 0 && next) setActivePhotoId(next.id);
    } catch {
      if (navigationRequest.current === token)
        toast.error('다음 사진을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      if (navigationRequest.current === token) setNavigationPending(false);
    }
  }

  function leaveSelectionMode() {
    cancelSelectAll();
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

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/trips/${tripId}/unclassified?trip=${encodeURIComponent(tripName)}`);
  }

  function restorePhotos(targets: UnclassifiedPhoto[], fallbackPlaceId?: number) {
    capture(targets.map((photo) => photo.id));
    requestRestore(
      { photos: targets, fallbackPlaceId },
      {
        onSuccess: () => {
          setPlaceRequest(null);
          openPhoto(null);
          leaveSelectionMode();
        },
        onError: (error) => {
          if (error instanceof RestorePlaceRequiredError) {
            setPlaceRequest({ photos: targets, photoCount: error.photoCount });
          }
        },
      },
    );
  }

  function confirmDelete() {
    capture(pendingDeleteIds);
    requestDelete(pendingDeleteIds, {
      onSuccess: () => {
        openPhoto(null);
        leaveSelectionMode();
      },
      onSettled: () => setPendingDeleteIds([]),
    });
  }

  return (
    <main
      ref={mainRef}
      aria-busy={isRestoring || isDeleting || isRefreshing}
      className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-4 pb-8"
    >
      <header className="bg-surface/95 sticky top-0 z-20 -mx-4 grid min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] grid-cols-[64px_1fr_64px] items-center px-4 pt-[max(20px,env(safe-area-inset-top))] backdrop-blur-sm">
        {selectionMode ? (
          <button
            type="button"
            onClick={leaveSelectionMode}
            disabled={isRestoring || isDeleting}
            className="focus-visible:outline-brand justify-self-start rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
          >
            취소
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            aria-label="미분류 폴더로 돌아가기"
            className="hover:bg-brand/5 focus-visible:outline-brand grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2"
          >
            <ChevronLeftIcon strokeWidth="2" size="22" />
          </button>
        )}

        <h1 className="truncate text-center text-[17px] font-extrabold">
          {selectionMode ? `${selectedCount}장 선택됨` : label}
        </h1>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => (selectionMode ? void toggleAll() : setSelectionMode(true))}
            disabled={isRestoring || isDeleting || isSelectingAll}
            className="focus-visible:outline-brand justify-self-end rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
          >
            {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
          </button>
        )}
      </header>

      <p className="text-muted mt-1 truncate text-[11px]">
        {tripName}
        {viewState === 'ready' &&
          ` · ${isSelectingAll ? '전체 사진을 불러오는 중이에요' : selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장${hasNextPage ? ' 불러옴' : ''}`}`}
      </p>

      {isRefreshing && (isRestoring || isDeleting || photos.length === 0) && (
        <p role="status" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          남은 사진을 확인하고 있어요.
        </p>
      )}
      {refreshError && (
        <div role="alert" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          남은 사진을 확인하지 못했어요.
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            다시 확인
          </button>
        </div>
      )}

      {viewState !== 'ready' ? (
        <PhotoGridSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      ) : photos.length === 0 && (isRefreshing || isRestoring || isDeleting) ? (
        <div className="mt-3">
          <PhotoGridSkeletonTiles count={6} />
        </div>
      ) : photos.length === 0 && !hasNextPage && !refreshError ? (
        <EmptyPhotoList />
      ) : (
        <ul
          aria-label={`${label} 목록`}
          className={`mt-3 grid grid-cols-3 gap-1 ${isSelectingAll ? 'pb-32' : selectionMode ? 'pb-20' : ''}`}
        >
          {photos.map((photo, index) => {
            const selected = selectedIds.has(photo.id);
            return (
              <li key={photo.id} data-photo-id={photo.id}>
                {selectionMode ? (
                  <button
                    type="button"
                    disabled={isRestoring || isDeleting || isSelectingAll}
                    aria-label={`${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`}
                    aria-pressed={selected}
                    onClick={() => togglePhoto(photo.id)}
                    className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
                  >
                    <PhotoArtwork photo={photo} />
                    <SelectionMark selected={selected} />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`${index + 1}번째 사진 상세보기`}
                    onClick={() => openPhoto(photo.id)}
                    className="focus-visible:outline-brand relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
                  >
                    <PhotoArtwork photo={photo} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {viewState === 'ready' && hasNextPage && (
        <div ref={sentinelRef} className="mt-1 pb-4 text-center">
          {nextPageError && (
            <p role="alert" className="mb-2 text-sm text-red-700">
              사진을 더 불러오지 못했어요. 이미 불러온 사진은 볼 수 있어요.
            </p>
          )}
          {isFetchingNextPage && (
            <div role="status" aria-label="사진 추가 로딩 중" aria-busy="true">
              <PhotoGridSkeletonTiles count={6} />
              <p className="my-2 text-sm text-slate-500">사진을 더 불러오는 중…</p>
            </div>
          )}
          <button
            type="button"
            disabled={isFetchingNextPage || isSelectingAll || isRestoring || isDeleting}
            className="mt-3 rounded-lg bg-slate-100 px-4 py-3 text-sm disabled:opacity-50"
            onClick={() => {
              if (invalidCursor) void refetch();
              else void loadNextPage().catch(() => {});
            }}
          >
            {nextPageError ? '사진 추가 로딩 다시 시도' : '사진 더 불러오기'}
          </button>
        </div>
      )}
      {isSelectingAll && (
        <PhotoSelectionProgress loadedCount={photos.length} onCancel={cancelSelectAll} />
      )}
      {selectionMode && !isSelectingAll && viewState === 'ready' && photos.length > 0 && (
        <SelectionActions
          disabled={selectedCount === 0 || isRestoring || isDeleting}
          isRestoring={isRestoring}
          onRestore={() => restorePhotos(photos.filter((photo) => selectedIds.has(photo.id)))}
          onDelete={() => setPendingDeleteIds(visibleSelectedIds)}
        />
      )}

      {activePhoto && (
        <PhotoViewer
          photo={activePhoto}
          current={activeIndex + 1}
          total={photos.length}
          hasMorePhotos={hasNextPage}
          previousDisabled={hasNextPage && activeIndex === 0}
          navigationPending={navigationPending}
          tripName={tripName}
          placeName={label}
          onClose={() => openPhoto(null)}
          onPrevious={() => openPhoto(photos[(activeIndex - 1 + photos.length) % photos.length].id)}
          onNext={() => void nextPhoto()}
          actionsDisabled={isRestoring || isDeleting}
          onRestore={() => restorePhotos([activePhoto])}
          onDelete={() => setPendingDeleteIds([activePhoto.id])}
        />
      )}

      <Dialog
        destructive
        open={pendingDeleteIds.length > 0}
        onClose={() => !isDeleting && setPendingDeleteIds([])}
        title={
          pendingDeleteIds.length > 1
            ? `사진 ${pendingDeleteIds.length}장을 삭제하시겠습니까?`
            : '정말 삭제하시겠습니까?'
        }
        description="삭제 후에는 되돌릴 수 없습니다."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setPendingDeleteIds([])}
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
      <RestorePlaceDialog
        open={placeRequest !== null}
        tripId={tripId}
        photoCount={placeRequest?.photoCount ?? 0}
        isRestoring={isRestoring}
        onClose={() => setPlaceRequest(null)}
        onConfirm={(tripPlaceId) => placeRequest && restorePhotos(placeRequest.photos, tripPlaceId)}
      />
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
        <RestoreIcon size="17" /> 해제
      </Button>
      <Button
        variant="destructive"
        disabled={disabled}
        onClick={onDelete}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <TrashIcon size="17" /> 삭제
      </Button>
    </div>,
    document.body,
  );
}

function EmptyPhotoList() {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <ImageIcon strokeWidth="1.7" size="32" />
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
