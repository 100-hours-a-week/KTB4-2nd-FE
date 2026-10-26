'use client';

import { useQuery } from '@tanstack/react-query';

import { userStatsQueries } from '@/queryFactory';

export function useUserStats() {
  const { data, isPending, isError, refetch } = useQuery(userStatsQueries.stats());
  return { stats: data ?? null, isPending, isError, refetch };
}
