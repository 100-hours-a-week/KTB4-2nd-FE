'use client';

import { useQuery } from '@tanstack/react-query';

import { searchQueries } from '@/queryFactory';

import { SEARCH_QUERY_MIN_LENGTH, type SearchViewState } from './types';

export function useSearch(query: string) {
  const enabled = query.length >= SEARCH_QUERY_MIN_LENGTH;
  const { data, isPending, isError, refetch } = useQuery({
    ...searchQueries.result(query),
    enabled,
  });

  const viewState: SearchViewState = !enabled
    ? 'idle'
    : isError
      ? 'error'
      : isPending
        ? 'loading'
        : 'ready';

  return { result: data ?? null, viewState, refetch };
}
