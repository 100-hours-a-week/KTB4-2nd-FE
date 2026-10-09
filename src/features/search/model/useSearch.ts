'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { searchQueries } from '@/queryFactory';

import { SEARCH_QUERY_MIN_LENGTH, type SearchViewState } from './types';

export function useSearch(query: string) {
  const enabled = query.length >= SEARCH_QUERY_MIN_LENGTH;
  const { data, error, isPending, isError, refetch } = useQuery({
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

  // AI 검색 서버를 쓸 수 없으면 503으로 내려와 일반 실패와 문구를 나눕니다.
  const errorMessage =
    axios.isAxiosError(error) && error.response?.status === 503
      ? '지금은 검색을 사용할 수 없어요. 잠시 후 다시 시도해주세요.'
      : '검색 결과를 가져오지 못했어요.';

  return { result: data ?? null, viewState, errorMessage, refetch };
}
