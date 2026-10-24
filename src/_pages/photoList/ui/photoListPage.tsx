'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  BULK_DOWNLOAD_LIMIT,
  PhotoViewer,
  usePhotoDelete,
  usePhotoDownload,
  usePlacePhotos,
} from '@/features/photoList';
import { toast } from '@/shared/ui/toast';

import { EmptyPhotoList } from './components/emptyPhotoList';
import { PhotoDeleteDialog } from './components/photoDeleteDialog';
import { PhotoGridItem } from './components/photoGridItem';
import { PhotoGridSkeleton } from './components/photoGridSkeleton';
import { PhotoListHeader } from './components/photoListHeader';
import { SelectionActions } from './components/selectionActions';

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
  const { mutate: requestDelete, isPending: isDeleting } = usePhotoDelete();
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
        onToggleAll={() =>
          setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
        }
      />

      <p className="text-muted mt-1 truncate text-[11px]">
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

      <PhotoDeleteDialog
        count={pendingDeleteIds.length}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
