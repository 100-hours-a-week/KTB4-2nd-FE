'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { SimilarStoryPhoto, StoryEditBlock } from '@/features/tripStory';
import { tripStoryQueries } from '@/queryFactory';
import { BottomSheet } from '@/shared/ui/bottomSheet';
import { Button } from '@/shared/ui/button';
import { ImageOffIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export function StoryPhotoReplaceSheet({
  tripId,
  storyId,
  block,
  usedAttachmentIds,
  onSelect,
  onClose,
}: {
  tripId: number;
  storyId: number;
  /** 바꿀 사진입니다. null이면 창을 닫습니다. */
  block: StoryEditBlock | null;
  /** 편집 중인 스토리에 이미 들어간 사진은 후보에서 뺍니다. */
  usedAttachmentIds: Set<number>;
  onSelect: (photo: SimilarStoryPhoto) => void;
  onClose: () => void;
}) {
  const query = useQuery({
    ...tripStoryQueries.similarPhotos({
      tripId,
      storyId,
      tripPlaceId: block?.tripPlaceId ?? 0,
      storyBlockId: block?.storyBlockId ?? 0,
    }),
    enabled: block !== null,
  });
  const photos = (query.data ?? []).filter(
    (photo) => !usedAttachmentIds.has(photo.tripAttachmentId),
  );

  return (
    <BottomSheet
      open={block !== null}
      onClose={onClose}
      title="비슷한 사진으로 바꾸기"
      description="같은 장소의 비슷한 사진이에요. 제목과 문장은 그대로 둬요."
    >
      {query.isPending ? (
        <div role="status" aria-label="비슷한 사진 찾는 중" className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-4">
          <p className="text-muted text-sm">비슷한 사진을 불러오지 못했어요.</p>
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
      ) : photos.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">바꿀 수 있는 비슷한 사진이 없어요.</p>
      ) : (
        <ul aria-label="비슷한 사진" className="grid grid-cols-3 gap-1.5">
          {photos.map((photo, index) => (
            <li key={photo.tripAttachmentId}>
              <CandidateButton
                photo={photo}
                label={`비슷한 사진 ${index + 1}번째로 바꾸기`}
                onSelect={() => onSelect(photo)}
              />
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onClick={onClose} className="mt-4 w-full">
        닫기
      </Button>
    </BottomSheet>
  );
}

function CandidateButton({
  photo,
  label,
  onSelect,
}: {
  photo: SimilarStoryPhoto;
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
      {failed || !photo.thumbnailUrl ? (
        <span className="text-muted grid size-full place-items-center">
          <ImageOffIcon strokeWidth="1.5" size="22" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl}
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
