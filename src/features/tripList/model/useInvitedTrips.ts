'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripListQueries } from '@/queryFactory';

import type { InvitedTripListItem, TripListViewState } from './types';

export function useInvitedTrips() {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(tripListQueries.invited());

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isError) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  const trips = useMemo<InvitedTripListItem[]>(
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
