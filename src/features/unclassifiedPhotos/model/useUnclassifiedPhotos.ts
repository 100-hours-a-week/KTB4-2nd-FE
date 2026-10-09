'use client';

import { useQuery } from '@tanstack/react-query';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedIssue, UnclassifiedViewState } from './types';

export function useUnclassifiedPhotos(tripId: number, issue: UnclassifiedIssue) {
  const { data, isPending, isError, refetch } = useQuery(
    unclassifiedPhotosQueries.photos(tripId, issue),
  );

  const viewState: UnclassifiedViewState = isError ? 'error' : isPending ? 'loading' : 'ready';

  return { photos: data ?? [], viewState, refetch };
}
