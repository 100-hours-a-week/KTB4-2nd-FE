'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedIssue, UnclassifiedPhoto, UnclassifiedViewState } from './types';

export function useUnclassifiedPhotos(tripId: number, issue: UnclassifiedIssue) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(unclassifiedPhotosQueries.photos(tripId, issue));

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const photos = useMemo<UnclassifiedPhoto[]>(
    () => data?.pages.flatMap((page) => page.photos) ?? [],
    [data],
  );

  const viewState: UnclassifiedViewState = isError
    ? 'error'
    : isPending || hasNextPage || isFetchingNextPage
      ? 'loading'
      : 'ready';

  return { photos, viewState, refetch };
}
