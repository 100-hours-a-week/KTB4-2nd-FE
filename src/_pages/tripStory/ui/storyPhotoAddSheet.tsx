'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { photoListQueries, tripDetailQueries } from '@/queryFactory';
import { BottomSheet } from '@/shared/ui/bottomSheet';
import { Button } from '@/shared/ui/button';
import { ImageOffIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export type StoryPhotoToAdd = {
  tripPlaceId: number;
  tripAttachmentId: number;
  thumbnailUrl: string | null;
  placeName?: string;
};

export function StoryPhotoAddSheet({
  tripId,
  placeIds,
  open,
  usedAttachmentIds,
  onSelect,
  onClose,
}: {
  tripId: number;
  placeIds: number[];
  open: boolean;
  usedAttachmentIds: Set<number>;
  onSelect: (photo: StoryPhotoToAdd) => void;
  onClose: () => void;
}) {
  const folders = useInfiniteQuery({ ...tripDetailQueries.placeFolders(tripId), enabled: open });
  const placeNames = new Map(
    folders.data?.pages.flatMap((page) => page.folders).map((folder) => [folder.id, folder.name]),
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="사진 추가"
      description="이 날 다녀온 장소의 사진 중에서 골라요."
    >
      <div className="space-y-5">
        {placeIds.map((placeId) => (
          <PlacePhotos
            key={placeId}
            tripId={tripId}
            placeId={placeId}
            placeName={placeNames.get(placeId)}
            usedAttachmentIds={usedAttachmentIds}
            onSelect={onSelect}
          />
        ))}
      </div>
      <Button variant="secondary" onClick={onClose} className="mt-4 w-full">
        닫기
      </Button>
    </BottomSheet>
  );
}

function PlacePhotos({
  tripId,
  placeId,
  placeName,
  usedAttachmentIds,
  onSelect,
}: {
  tripId: number;
  placeId: number;
  placeName?: string;
  usedAttachmentIds: Set<number>;
  onSelect: (photo: StoryPhotoToAdd) => void;
}) {
  const query = useInfiniteQuery(photoListQueries.placePhotos(tripId, placeId));
  const photos = (query.data?.pages.flatMap((page) => page.photos) ?? []).filter(
    (photo) => !usedAttachmentIds.has(photo.id),
  );
  const title = placeName ?? '장소 사진';

  return (
    <section aria-label={title}>
      <h3 className="mb-2 text-xs font-bold">{title}</h3>
      {query.isPending ? (
        <div role="status" aria-label={`${title} 불러오는 중`} className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 py-2">
          <p className="text-muted text-xs">사진을 불러오지 못했어요.</p>
          <Button
            variant="secondary"
            size="sm"
            isLoading={query.isFetching}
            loadingText="불러오는 중…"
            onClick={() => void query.refetch()}
          >
            다시 시도
          </Button>
        </div>
      ) : photos.length === 0 && !query.hasNextPage ? (
        <p className="text-muted py-2 text-xs">더 넣을 수 있는 사진이 없어요.</p>
      ) : (
        <>
          <ul aria-label={`${title} 사진`} className="grid grid-cols-3 gap-1.5">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <CandidateButton
                  thumbnailUrl={photo.thumbnailUrl ?? null}
                  label={`${title} ${index + 1}번째 사진 넣기`}
                  onSelect={() =>
                    onSelect({
                      tripPlaceId: placeId,
                      tripAttachmentId: photo.id,
                      thumbnailUrl: photo.thumbnailUrl ?? null,
                      placeName,
                    })
                  }
                />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={query.isFetchingNextPage}
              loadingText="불러오는 중…"
              onClick={() => void query.fetchNextPage()}
              className="mt-2 w-full"
            >
              사진 더 보기
            </Button>
          )}
        </>
      )}
    </section>
  );
}

function CandidateButton({
  thumbnailUrl,
  label,
  onSelect,
}: {
  thumbnailUrl: string | null;
  label: string;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      className="focus-visible:outline-brand bg-surface-subtle relative block aspect-square w-full overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {failed || !thumbnailUrl ? (
        <span className="text-muted grid size-full place-items-center">
          <ImageOffIcon strokeWidth="1.5" size="22" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          width={120}
          height={120}
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </button>
  );
}
