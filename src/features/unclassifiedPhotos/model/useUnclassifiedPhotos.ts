'use client';

import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedPhotoPageResult } from '../api/getUnclassifiedPhotos';
import type { UnclassifiedIssue, UnclassifiedPhoto, UnclassifiedViewState } from './types';

type PhotoPages = InfiniteData<UnclassifiedPhotoPageResult>;

function collectPhotos(data: PhotoPages | undefined): UnclassifiedPhoto[] {
  return [
    ...new Map(
      data?.pages.flatMap((page) => page.photos).map((photo) => [photo.id, photo]),
    ).values(),
  ];
}

function cursorIsInvalid(data: PhotoPages | undefined) {
  const last = data?.pages.at(-1);
  return !!last?.hasNext && (!last.nextCursor || !!data?.pageParams.includes(last.nextCursor));
}

export function useUnclassifiedPhotos(tripId: number, issue: UnclassifiedIssue) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery(unclassifiedPhotosQueries.photos(tripId, issue));
  const { data, fetchNextPage } = query;
  // One in-flight next-page request shared by scrolling, viewer navigation and select-all.
  const request = useRef<{ key: string; pending: Promise<PhotoPages> } | null>(null);
  const requestKey = `${tripId}:${issue}`;
  const photos = useMemo(() => collectPhotos(data), [data]);
  const invalidCursor = cursorIsInvalid(data);
  const hasNextPage = query.hasNextPage || invalidCursor;
  const viewState: UnclassifiedViewState = data ? 'ready' : query.isError ? 'error' : 'loading';
  let emptyPageCount = 0;
  for (const page of [...(data?.pages ?? [])].reverse()) {
    if (page.photos.length) break;
    emptyPageCount++;
  }

  const fetchPage = useCallback((): Promise<PhotoPages> => {
    if (request.current?.key === requestKey) return request.current.pending;
    const pending: Promise<PhotoPages> = fetchNextPage({ cancelRefetch: false })
      .then((result) => {
        if (result.isError) throw result.error;
        if (!result.data) throw new Error('사진을 불러오지 못했어요.');
        return result.data;
      })
      .finally(() => {
        if (request.current?.pending === pending) request.current = null;
      });
    request.current = { key: requestKey, pending };
    return pending;
  }, [requestKey, fetchNextPage]);

  const loadNextPage = useCallback(async () => {
    if (invalidCursor) throw new Error('사진 목록의 다음 페이지 정보가 올바르지 않아요.');
    if (!query.hasNextPage) return photos;
    return collectPhotos(await fetchPage());
  }, [invalidCursor, query.hasNextPage, photos, fetchPage]);

  const loadAllPhotos = useCallback(
    async (signal: AbortSignal) => {
      const cancel = () => {
        void queryClient.cancelQueries({
          queryKey: unclassifiedPhotosQueries.photoKeys(tripId, issue),
          exact: true,
        });
      };
      signal.addEventListener('abort', cancel, { once: true });
      let current = data;
      try {
        while (current?.pages.at(-1)?.hasNext) {
          if (signal.aborted) throw new DOMException('전체 선택 취소', 'AbortError');
          if (cursorIsInvalid(current))
            throw new Error('사진 목록의 다음 페이지 정보가 올바르지 않아요.');
          current = await fetchPage();
        }
        if (signal.aborted) throw new DOMException('전체 선택 취소', 'AbortError');
        return collectPhotos(current);
      } finally {
        signal.removeEventListener('abort', cancel);
      }
    },
    [data, fetchPage, queryClient, tripId, issue],
  );

  return {
    photos,
    viewState,
    refetch: query.refetch,
    hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefreshing: query.isRefetching,
    refreshError: query.isRefetchError,
    nextPageError: invalidCursor || query.isFetchNextPageError,
    invalidCursor,
    autoLoadEnabled: emptyPageCount < 3,
    pageCount: data?.pages.length ?? 0,
    loadNextPage,
    loadAllPhotos,
  };
}
