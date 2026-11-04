'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  TripPlaceMap,
  useDeleteTrip,
  useTripPlaceFolders,
  useTripSummary,
  type TripDetail,
} from '@/features/tripDetail';
import { TripShareDialog } from '@/features/tripShare';
import { useUnclassifiedFolders } from '@/features/unclassifiedPhotos';
import { PageHeader } from '@/shared/ui/pageHeader';

import { DeleteTripDialog } from './components/deleteTripDialog';
import { EmptyPlaceFolders } from './components/emptyPlaceFolders';
import { PlaceFolderCard } from './components/placeFolderCard';
import { PlaceFolderSkeleton } from './components/placeFolderSkeleton';
import { StoryEmptyDialog } from './components/storyEmptyDialog';
import { TripDetailMenu } from './components/tripDetailMenu';
import { TripMeta } from './components/tripMeta';
import { TripShortcuts } from './components/tripShortcuts';
import { type TripDetailViewMode, ViewModeToggle } from './components/viewModeToggle';

export type TripDetailPageProps = {
  trip: TripDetail;
};

export function TripDetailPage({ trip: initialTrip }: TripDetailPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode: TripDetailViewMode = searchParams.get('view') === 'map' ? 'map' : 'list';
  const trip = useTripSummary(initialTrip);
  const { folders, viewState, refetch } = useTripPlaceFolders(trip.id);
  const unclassified = useUnclassifiedFolders(trip.id);
  const unclassifiedCount = unclassified.folders.reduce(
    (sum, folder) => sum + folder.photoCount,
    0,
  );
  const totalPhotoCount = trip.photoCount + unclassifiedCount;
  const { mutate: requestDelete, isPending: isDeleting } = useDeleteTrip(trip.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [storyEmptyOpen, setStoryEmptyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleBack = () => {
    router.replace('/trips');
  };

  // 사진 목록에서 돌아왔을 때 보던 형태를 유지하도록 URL에 남긴다.
  function changeViewMode(mode: TripDetailViewMode) {
    if (mode === viewMode) return;
    router.replace(mode === 'map' ? `${pathname}?view=map` : pathname, { scroll: false });
  }

  function openStory() {
    if (trip.hasStory) {
      router.push(`/trips/${trip.id}/story`);
      return;
    }

    setStoryEmptyOpen(true);
  }

  return (
    <main className="text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-10">
      <PageHeader
        className="-mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title={trip.name}
        onBack={handleBack}
        backLabel="여행 목록으로 돌아가기"
        action={
          <TripDetailMenu
            onEdit={() => router.push(`/trips/${trip.id}/edit?step=name`)}
            onShare={() => setShareOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        }
      />

      <TripMeta trip={trip} unclassifiedCount={unclassifiedCount} />

      <TripShortcuts tripId={trip.id} tripName={trip.name} onOpenStory={openStory} />

      <ViewModeToggle mode={viewMode} onChange={changeViewMode} />

      <section aria-label="장소별 사진" className="mt-5">
        {viewMode === 'map' ? (
          <TripPlaceMap tripId={trip.id} tripName={trip.name} />
        ) : viewState !== 'ready' ? (
          <PlaceFolderSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
        ) : folders.length === 0 ? (
          <EmptyPlaceFolders
            trip={trip}
            hasPhotos={totalPhotoCount > 0}
            isCounting={unclassified.viewState === 'loading'}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4">
            {folders.map((folder) => (
              <li key={folder.id}>
                <PlaceFolderCard trip={trip} folder={folder} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <StoryEmptyDialog
        open={storyEmptyOpen}
        onClose={() => setStoryEmptyOpen(false)}
        onCreate={() => {
          setStoryEmptyOpen(false);
          router.push(`/trips/${trip.id}/story/create`);
        }}
      />

      <TripShareDialog
        open={shareOpen}
        tripId={trip.id}
        tripName={trip.name}
        onClose={() => setShareOpen(false)}
      />

      <DeleteTripDialog
        open={deleteOpen}
        tripName={trip.name}
        photoCount={totalPhotoCount}
        isDeleting={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => requestDelete(undefined, { onError: () => setDeleteOpen(false) })}
      />
    </main>
  );
}
