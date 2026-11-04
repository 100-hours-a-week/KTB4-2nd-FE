'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripListQueries } from '@/queryFactory';

import type { TripListItem, TripListViewState } from './types';

export function useFavoriteTrips() {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(tripListQueries.favorites());

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isError) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  const trips = useMemo<TripListItem[]>(
    () => data?.pages.flatMap((page) => page.trips) ?? [],
    [data],
  );

  const viewState: TripListViewState =
    trips.length > 0 ? 'ready' : isError ? 'error' : isPending || hasNextPage ? 'loading' : 'ready';

  return {
    trips,
    totalCount: data?.pages[0]?.totalCount ?? trips.length,
    viewState,
    refetch,
  };
}
