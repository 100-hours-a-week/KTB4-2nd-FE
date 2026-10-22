'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripListQueries } from '@/queryFactory';

import type { TripListFilter, TripListItem, TripListViewState } from './types';

export function useTripList(filter: TripListFilter) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(tripListQueries.list(filter));

  useEffect(() => {
    // 다음 페이지 조회가 실패하면 isFetchingNextPage가 false로 돌아와 바로 다시 요청하게 됩니다.
    // 실패한 동안은 멈추고, 사용자가 다시 시도(refetch)해서 성공하면 이어서 불러옵니다.
    if (!hasNextPage || isFetchingNextPage || isError) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

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
