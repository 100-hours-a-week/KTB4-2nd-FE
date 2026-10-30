'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { PhotoViewer } from '@/features/photoList';
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
import { PhotoSelectionProgress } from '@/features/photoList/ui/photoSelectionProgress';
import {
  PhotoGridSkeleton,
  PhotoGridSkeletonTiles,
} from '@/_pages/photoList/ui/components/photoGridSkeleton';

import { usePhotoAutoLoad } from '../lib/usePhotoAutoLoad';
import { usePhotoListPosition } from '../lib/usePhotoListPosition';
import { useUnclassifiedPhotoSelection } from '../model/useUnclassifiedPhotoSelection';
import { useUnclassifiedPhotoViewer } from '../model/useUnclassifiedPhotoViewer';
import { UnclassifiedPhotoActions } from './components/unclassifiedPhotoActions';
import { UnclassifiedPhotoDeleteDialog } from './components/unclassifiedPhotoDeleteDialog';
import { UnclassifiedPhotoGrid } from './components/unclassifiedPhotoGrid';
import { UnclassifiedPhotoHeader } from './components/unclassifiedPhotoHeader';
import { UnclassifiedPhotoPagination } from './components/unclassifiedPhotoPagination';

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
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [placeRequest, setPlaceRequest] = useState<{
    photos: UnclassifiedPhoto[];
    photoCount: number;
  } | null>(null);
  const isProcessing = isRestoring || isDeleting;
  const selection = useUnclassifiedPhotoSelection({ photos, hasNextPage, loadAllPhotos });
  const viewer = useUnclassifiedPhotoViewer({ photos, hasNextPage, loadNextPage });
  const { mainRef, capture } = usePhotoListPosition(photos, isProcessing || isRefreshing);
  const sentinelRef = usePhotoAutoLoad({
    enabled:
      hasNextPage &&
      !isFetchingNextPage &&
      !nextPageError &&
      autoLoadEnabled &&
      !selection.isSelectingAll &&
      !isProcessing &&
      !viewer.isOpen,
    pageCount,
    loadNextPage,
  });
  const label = UNCLASSIFIED_ISSUE_LABEL[issue];

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
          viewer.closePhoto();
          selection.leaveSelectionMode();
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
        viewer.closePhoto();
        selection.leaveSelectionMode();
      },
      onSettled: () => setPendingDeleteIds([]),
    });
  }

  return (
    <main
      ref={mainRef}
      aria-busy={isProcessing || isRefreshing}
      className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-4 pb-8"
    >
      <UnclassifiedPhotoHeader
        label={label}
        selectionMode={selection.selectionMode}
        selectedCount={selection.selectedCount}
        allSelected={selection.allSelected}
        canSelect={photos.length > 0}
        isProcessing={isProcessing}
        isSelectingAll={selection.isSelectingAll}
        onBack={handleBack}
        onCancelSelection={selection.leaveSelectionMode}
        onEnterSelection={selection.enterSelectionMode}
        onToggleAll={() => void selection.toggleAll()}
      />

      <p className="text-muted mt-1 truncate text-[11px]">
        {tripName}
        {viewState === 'ready' &&
          ` · ${selection.isSelectingAll ? '전체 사진을 불러오는 중이에요' : selection.selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장${hasNextPage ? ' 불러옴' : ''}`}`}
      </p>

      {isRefreshing && (isProcessing || photos.length === 0) && (
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
      ) : photos.length === 0 && (isRefreshing || isProcessing) ? (
        <div className="mt-3">
          <PhotoGridSkeletonTiles count={6} />
        </div>
      ) : (
        <UnclassifiedPhotoGrid
          photos={photos}
          label={label}
          selectionMode={selection.selectionMode}
          selectedIds={selection.selectedIds}
          isSelectingAll={selection.isSelectingAll}
          disabled={isProcessing}
          showEmpty={photos.length === 0 && !hasNextPage && !refreshError}
          onTogglePhoto={selection.togglePhoto}
          onOpenPhoto={viewer.openPhoto}
        />
      )}

      {viewState === 'ready' && hasNextPage && (
        <UnclassifiedPhotoPagination
          ref={sentinelRef}
          isLoading={isFetchingNextPage}
          hasError={nextPageError}
          disabled={isFetchingNextPage || selection.isSelectingAll || isProcessing}
          onLoadMore={() => {
            if (invalidCursor) void refetch();
            else void loadNextPage().catch(() => {});
          }}
        />
      )}
      {selection.isSelectingAll && (
        <PhotoSelectionProgress loadedCount={photos.length} onCancel={selection.cancelSelectAll} />
      )}
      {selection.selectionMode &&
        !selection.isSelectingAll &&
        viewState === 'ready' &&
        photos.length > 0 &&
        createPortal(
          <div className="fixed right-0 bottom-[var(--app-vertical-offset,0px)] left-0 z-30 mx-auto w-full max-w-[430px] shadow-navigation">
            <UnclassifiedPhotoActions
              selectedCount={selection.selectedCount}
              isRestoring={isRestoring}
              isDeleting={isDeleting}
              onRestore={() => restorePhotos(selection.selectedPhotos)}
              onDelete={() =>
                setPendingDeleteIds(selection.selectedPhotos.map((photo) => photo.id))
              }
            />
          </div>,
          document.body,
        )}

      {viewer.activePhoto && (
        <PhotoViewer
          photo={viewer.activePhoto}
          current={viewer.activeIndex + 1}
          total={photos.length}
          hasMorePhotos={hasNextPage}
          previousDisabled={hasNextPage && viewer.activeIndex === 0}
          navigationPending={viewer.navigationPending}
          tripName={tripName}
          placeName={label}
          onClose={viewer.closePhoto}
          onPrevious={viewer.previousPhoto}
          onNext={() => void viewer.nextPhoto()}
          actionsDisabled={isProcessing}
          onRestore={() => viewer.activePhoto && restorePhotos([viewer.activePhoto])}
          onDelete={() => viewer.activePhoto && setPendingDeleteIds([viewer.activePhoto.id])}
        />
      )}

      <UnclassifiedPhotoDeleteDialog
        count={pendingDeleteIds.length}
        isDeleting={isDeleting}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={confirmDelete}
      />
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
