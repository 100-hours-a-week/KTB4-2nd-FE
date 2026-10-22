'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { photoListQueries } from '@/queryFactory';

import type { PhotoListItem, PhotoListViewState } from './types';

/**
 * 사진은 18장씩 커서로 내려옵니다.
 * 헤더가 전체 장수를 보여주고 전체 선택도 제공해야 해서 남은 페이지를 모두 이어서 불러옵니다.
 */
export function usePlacePhotos(tripId: number, tripPlaceId: number) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(photoListQueries.placePhotos(tripId, tripPlaceId));

  useEffect(() => {
    // 다음 페이지 조회가 실패하면 isFetchingNextPage가 false로 돌아와 바로 다시 요청하게 됩니다.
    // 실패한 동안은 멈추고, 사용자가 다시 시도(refetch)해서 성공하면 이어서 불러옵니다.
    if (!hasNextPage || isFetchingNextPage || isError) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  const photos = useMemo<PhotoListItem[]>(
    () => data?.pages.flatMap((page) => page.photos) ?? [],
    [data],
  );

  const viewState: PhotoListViewState = isError
    ? 'error'
    : isPending || hasNextPage || isFetchingNextPage
      ? 'loading'
      : 'ready';

  return { photos, viewState, refetch };
}
