'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  useDeleteTrip,
  useTripPlaceFolders,
  useTripSummary,
  type TripDetail,
} from '@/features/tripDetail';
import { useUnclassifiedFolders } from '@/features/unclassifiedPhotos';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';
import { EditIcon, LinkIcon, TrashIcon } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';
import { toast } from '@/shared/ui/toast';

import { DeleteTripDialog } from './components/deleteTripDialog';
import { EmptyPlaceFolders } from './components/emptyPlaceFolders';
import { PlaceFolderCard } from './components/placeFolderCard';
import { PlaceFolderSkeleton } from './components/placeFolderSkeleton';
import { StoryEmptyDialog } from './components/storyEmptyDialog';
import { TripMeta } from './components/tripMeta';
import { TripShortcuts } from './components/tripShortcuts';
import { ViewModeToggle } from './components/viewModeToggle';

export type TripDetailPageProps = {
  trip: TripDetail;
};

export function TripDetailPage({ trip: initialTrip }: TripDetailPageProps) {
  const router = useRouter();
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

  const handleBack = () => {
    router.replace('/trips');
  };

  const showUnsupportedToast = () => toast.warning('아직 지원하지 않는 기능이에요.');

  function openStory() {
    if (trip.hasStory) {
      router.push(`/trips/${trip.id}/story`);
      return;
    }

    setStoryEmptyOpen(true);
  }

  const menuItems: DropdownMenuItem[] = [
    {
      id: 'edit',
      label: '여행 수정',
      icon: <EditIcon size="20" />,
      onSelect: () => router.push(`/trips/${trip.id}/edit?step=name`),
    },
    {
      id: 'share-link',
      label: '링크로 공유하기',
      icon: <LinkIcon size="20" />,
      badge: '준비 중',
      disabled: true,
      onSelect: showUnsupportedToast,
    },
    {
      id: 'delete',
      label: '여행 삭제',
      icon: <TrashIcon size="20" />,
      destructive: true,
      dividerBefore: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-10">
      <PageHeader
        className="-mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title={trip.name}
        onBack={handleBack}
        backLabel="여행 목록으로 돌아가기"
        action={<DropdownMenu items={menuItems} label="여행 더보기 메뉴" />}
      />

      <TripMeta trip={trip} unclassifiedCount={unclassifiedCount} />

      <TripShortcuts tripId={trip.id} tripName={trip.name} onOpenStory={openStory} />

      <ViewModeToggle onMapClick={showUnsupportedToast} />

      <section aria-label="장소별 사진" className="mt-5">
        {viewState !== 'ready' ? (
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
