'use client';

import { useQuery } from '@tanstack/react-query';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedViewState } from './types';

export function useUnclassifiedFolders(tripId: number) {
  const { data, isPending, isError, refetch } = useQuery(unclassifiedPhotosQueries.folders(tripId));

  const viewState: UnclassifiedViewState = isError ? 'error' : isPending ? 'loading' : 'ready';

  return { folders: data ?? [], viewState, refetch };
}
