'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { tripDetailQueries } from '@/queryFactory';

import type { TripDetailViewState, TripPlaceFolder } from './types';

/**
 * 장소 폴더 API는 6개씩 커서로 내려주지만 화면에 더 보기가 없어
 * 남은 페이지를 이어서 모두 불러온 뒤 한 번에 노출합니다.
 */
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
