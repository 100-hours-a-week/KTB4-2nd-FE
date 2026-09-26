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
    if (!hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
