'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedIssue, UnclassifiedPhoto, UnclassifiedViewState } from './types';

export function useUnclassifiedPhotos(tripId: number, issue: UnclassifiedIssue) {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(unclassifiedPhotosQueries.photos(tripId, issue));

  useEffect(() => {
    // 다음 페이지 조회가 실패하면 isFetchingNextPage가 false로 돌아와 바로 다시 요청하게 됩니다.
    // 실패한 동안은 멈추고, 사용자가 다시 시도(refetch)해서 성공하면 이어서 불러옵니다.
    if (!hasNextPage || isFetchingNextPage || isError) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

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
