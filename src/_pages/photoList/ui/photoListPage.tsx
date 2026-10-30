'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  BULK_DOWNLOAD_LIMIT,
  PhotoViewer,
  usePhotoDelete,
  usePhotoDownload,
  usePlacePhotos,
} from '@/features/photoList';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import { EmptyPhotoList } from './components/emptyPhotoList';
import { PhotoDeleteDialog } from './components/photoDeleteDialog';
import { PhotoGridItem } from './components/photoGridItem';
import { PhotoGridSkeleton, PhotoGridSkeletonTiles } from './components/photoGridSkeleton';
import { PhotoListHeader } from './components/photoListHeader';
import { SelectionActions } from './components/selectionActions';

export type PhotoListPageProps = {
  tripId: number;
  tripPlaceId: number;
  tripName: string;
  placeName: string;
};

export function PhotoListPage(props: PhotoListPageProps) {
  return <PhotoListContent key={`${props.tripId}:${props.tripPlaceId}`} {...props} />;
}

function PhotoListContent({ tripId, tripPlaceId, tripName, placeName }: PhotoListPageProps) {
  const router = useRouter();
  const {
    photos,
    viewState,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    nextPageError,
    invalidCursor,
    autoLoadEnabled,
    pageCount,
    loadNextPage,
    loadAllPhotos,
  } = usePlacePhotos(tripId, tripPlaceId);
  const { mutate: requestDownload, isPending: isDownloading } = usePhotoDownload();
  const { mutate: requestDelete, isPending: isDeleting } = usePhotoDelete();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [navigationPending, setNavigationPending] = useState(false);
  const selectionRequest = useRef<AbortController | null>(null);
  const navigationRequest = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      selectionRequest.current?.abort();
      navigationRequest.current++;
    },
    [],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !hasNextPage ||
      isFetchingNextPage ||
      nextPageError ||
      !autoLoadEnabled ||
      isSelectingAll ||
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

  const activeIndex = photos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = activeIndex >= 0 ? photos[activeIndex] : null;
  const selectedCount = selectedIds.size;
  const allSelected = !hasNextPage && photos.length > 0 && selectedCount === photos.length;

  function leaveSelectionMode() {
    cancelSelectAll();
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function togglePhoto(photoId: number) {
    if (isSelectingAll) return;
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
        openPhoto(null);
        leaveSelectionMode();
      },
      onSettled: () => setPendingDeleteIds([]),
    });
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/trips/${tripId}`);
  }

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-4 pb-8">
      <PhotoListHeader
        placeName={placeName}
        selectionMode={selectionMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        canSelect={photos.length > 0}
        onBack={handleBack}
        onEnterSelection={() => setSelectionMode(true)}
        onCancelSelection={leaveSelectionMode}
        onToggleAll={() => void toggleAll()}
        selectionDisabled={isSelectingAll || isDownloading || isDeleting}
        cancelDisabled={isDownloading || isDeleting}
      />

      <p className="text-muted mt-1 truncate text-[11px]">
        {tripName}
        {viewState === 'ready' &&
          ` · ${isSelectingAll ? '전체 사진을 불러오는 중이에요' : selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장${hasNextPage ? ' 불러옴' : ''}`}`}
      </p>

      {viewState !== 'ready' ? (
        <PhotoGridSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      ) : photos.length === 0 && !hasNextPage ? (
        <EmptyPhotoList onAdd={() => toast.warning('아직 지원하지 않는 기능이에요.')} />
      ) : (
        <ul
          aria-label="사진 목록"
          className={`mt-3 grid grid-cols-3 gap-1 ${isSelectingAll ? 'pb-32' : selectionMode ? 'pb-20' : ''}`}
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
                  disabled={isSelectingAll || isDownloading || isDeleting}
                  onActivate={() => (selectionMode ? togglePhoto(photo.id) : openPhoto(photo.id))}
                  onLongPress={() => selectPhotoFromLongPress(photo.id)}
                />
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
          <Button
            variant="secondary"
            size="sm"
            disabled={isFetchingNextPage || isSelectingAll}
            isLoading={isFetchingNextPage}
            loadingText="사진 불러오는 중…"
            className="mt-3"
            onClick={() => {
              if (invalidCursor) void refetch();
              else void loadNextPage().catch(() => {});
            }}
          >
            {nextPageError ? '사진 추가 로딩 다시 시도' : '사진 더 불러오기'}
          </Button>
        </div>
      )}
      {selectionMode && photos.length > 0 && (
        <SelectionActions
          disabled={selectedCount === 0 || isDownloading || isDeleting || isSelectingAll}
          downloadLimitExceeded={selectedCount > BULK_DOWNLOAD_LIMIT}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
          selectingAll={
            isSelectingAll ? { loadedCount: photos.length, onCancel: cancelSelectAll } : undefined
          }
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
          hasMorePhotos={hasNextPage}
          previousDisabled={hasNextPage && activeIndex === 0}
          navigationPending={navigationPending}
          actionsDisabled={isDownloading || isDeleting}
          onClose={() => openPhoto(null)}
          onPrevious={() => openPhoto(photos[(activeIndex - 1 + photos.length) % photos.length].id)}
          onNext={() => void nextPhoto()}
          onDownload={() => requestDownload([activePhoto.id])}
          onDelete={() => setPendingDeleteIds([activePhoto.id])}
        />
      )}

      <PhotoDeleteDialog
        count={pendingDeleteIds.length}
        isDeleting={isDeleting}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
