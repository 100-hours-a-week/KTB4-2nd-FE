import { queryOptions } from '@tanstack/react-query';

import { getFavoriteTripCount } from '@/features/userStats/api/getFavoriteTripCount';
import { getUserStats } from '@/features/userStats/api/getUserStats';

export const userStatsQueries = {
  allKeys: () => ['userStats'] as const,
  stats: () =>
    queryOptions({
      queryKey: [...userStatsQueries.allKeys(), 'stats'],
      queryFn: getUserStats,
    }),
  favoriteTripCount: () =>
    queryOptions({
      queryKey: [...userStatsQueries.allKeys(), 'favoriteTripCount'],
      queryFn: getFavoriteTripCount,
    }),
};
