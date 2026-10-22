'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { photoListQueries } from '@/queryFactory';

import type { PhotoListItem, PhotoListViewState } from './types';

export function usePlacePhotos(tripId: number, tripPlaceId: number) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(photoListQueries.placePhotos(tripId, tripPlaceId));

  useEffect(() => {
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
