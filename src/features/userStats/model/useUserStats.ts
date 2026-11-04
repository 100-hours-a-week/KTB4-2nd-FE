'use client';

import { useQuery } from '@tanstack/react-query';

import { userStatsQueries } from '@/queryFactory';

export function useUserStats() {
  const { data, isPending, isError, refetch } = useQuery(userStatsQueries.stats());
  const { data: favoriteTripCount } = useQuery(userStatsQueries.favoriteTripCount());

  return {
    stats: data ?? null,
    favoriteTripCount: favoriteTripCount ?? null,
    isPending,
    isError,
    refetch,
  };
}
