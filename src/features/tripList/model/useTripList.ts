'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripListQueries } from '@/queryFactory';

import type { TripListFilter, TripListItem, TripListViewState } from './types';

export function useTripList(filter: TripListFilter) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(tripListQueries.list(filter));

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const trips = useMemo<TripListItem[]>(
    () => data?.pages.flatMap((page) => page.trips) ?? [],
    [data],
  );

  const viewState: TripListViewState = isError
    ? 'error'
    : isPending || hasNextPage || isFetchingNextPage
      ? 'loading'
      : 'ready';

  return { trips, viewState, refetch };
}
