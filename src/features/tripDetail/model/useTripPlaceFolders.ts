'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripDetailQueries } from '@/queryFactory';

import type { TripDetailViewState, TripPlaceFolder } from './types';

export function useTripPlaceFolders(tripId: number) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(tripDetailQueries.placeFolders(tripId));

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const folders = useMemo<TripPlaceFolder[]>(
    () => data?.pages.flatMap((page) => page.folders) ?? [],
    [data],
  );

  const viewState: TripDetailViewState = isError
    ? 'error'
    : isPending || hasNextPage || isFetchingNextPage
      ? 'loading'
      : 'ready';

  return { folders, viewState, refetch };
}
