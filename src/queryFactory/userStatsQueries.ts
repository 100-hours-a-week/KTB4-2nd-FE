import { queryOptions } from '@tanstack/react-query';

import { getUserStats } from '@/features/userStats/api/getUserStats';

export const userStatsQueries = {
  allKeys: () => ['userStats'] as const,
  stats: () =>
    queryOptions({
      queryKey: userStatsQueries.allKeys(),
      queryFn: getUserStats,
    }),
};
